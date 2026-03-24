import json
import html

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.conf import settings

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import Project, Review, mask_email


def _verify_google_credential(credential):
    """Verify Google credential and return user info dict, or None on failure."""
    if not credential:
        return None
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        return {
            'id': idinfo.get('sub', ''),
            'name': idinfo.get('name', 'Anonymous'),
            'email': idinfo.get('email', ''),
            'picture': idinfo.get('picture', ''),
        }
    except Exception:
        return None


@csrf_exempt
def index(request):
    projects = Project.objects.select_related('category').prefetch_related('technologies').all()

    # Handle Google redirect POST (ux_mode: 'redirect' sends credential via POST)
    google_user = None
    google_credential = ''
    if request.method == 'POST' and request.POST.get('credential'):
        credential = request.POST.get('credential')
        google_user = _verify_google_credential(credential)
        if google_user:
            google_credential = credential

    context = {
        'projects': projects,
        'google_user_json': json.dumps(google_user) if google_user else 'null',
        'google_credential': google_credential,
    }
    return render(request, 'index.html', context)


@csrf_exempt
def reviews_page(request):
    """Display all approved reviews and the review form."""
    reviews = Review.objects.filter(is_approved=True).order_by('-created_at')

    # Build reviews data with masked emails
    reviews_data = []
    for review in reviews:
        reviews_data.append({
            'user_name': review.user_name,
            'masked_email': review.masked_email,
            'user_avatar': review.user_avatar,
            'rating': review.rating,
            'comment': review.comment,
            'created_at': review.created_at,
        })

    # Handle Google redirect POST
    google_user = None
    google_credential = ''
    if request.method == 'POST' and request.POST.get('credential'):
        credential = request.POST.get('credential')
        google_user = _verify_google_credential(credential)
        if google_user:
            google_credential = credential

    context = {
        'reviews': reviews_data,
        'csrf_token': get_token(request),
        'google_user_json': json.dumps(google_user) if google_user else 'null',
        'google_credential': google_credential,
    }
    return render(request, 'reviews.html', context)


@csrf_exempt
@require_POST
def submit_review(request):
    """API endpoint: verify Google token and create/update review."""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    credential = data.get('credential')
    rating = data.get('rating')
    comment = data.get('comment', '').strip()

    # Validate required fields
    if not credential:
        return JsonResponse({'error': 'Google credential is required.'}, status=400)
    if not rating:
        return JsonResponse({'error': 'Rating is required.'}, status=400)
    if not comment:
        return JsonResponse({'error': 'Comment is required.'}, status=400)

    # Validate rating range
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            raise ValueError
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Rating must be between 1 and 5.'}, status=400)

    # Sanitize comment (strip HTML tags)
    comment = html.escape(comment)
    if len(comment) > 1000:
        return JsonResponse({'error': 'Comment must be 1000 characters or less.'}, status=400)

    # Verify Google token server-side with audience check
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID  # Audience check
        )

        google_id = idinfo.get('sub')
        user_name = idinfo.get('name', 'Anonymous')
        user_email = idinfo.get('email', '')
        user_avatar = idinfo.get('picture', '')

        if not google_id:
            return JsonResponse({'error': 'Invalid token: missing user ID.'}, status=401)

    except ValueError as e:
        return JsonResponse({'error': f'Invalid or expired Google token.'}, status=401)
    except Exception as e:
        return JsonResponse({'error': 'Authentication failed. Please try again.'}, status=401)

    # Create or update review (upsert)
    review, created = Review.objects.update_or_create(
        google_id=google_id,
        defaults={
            'user_name': user_name,
            'user_email': user_email,
            'user_avatar': user_avatar,
            'rating': rating,
            'comment': comment,
            'is_approved': False,  # Require re-approval on update
        }
    )

    action = 'created' if created else 'updated'
    return JsonResponse({
        'success': True,
        'action': action,
        'review': {
            'user_name': review.user_name,
            'masked_email': review.masked_email,
            'rating': review.rating,
            'comment': review.comment,
        }
    }, status=200)


def get_user_review(request):
    """API endpoint: check if a user already has a review (by Google ID)."""
    google_id = request.GET.get('google_id', '')

    if not google_id:
        return JsonResponse({'has_review': False})

    try:
        review = Review.objects.get(google_id=google_id)
        return JsonResponse({
            'has_review': True,
            'review': {
                'rating': review.rating,
                'comment': html.unescape(review.comment),
            }
        })
    except Review.DoesNotExist:
        return JsonResponse({'has_review': False})
