from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('reviews/', views.reviews_page, name='reviews'),
    path('api/reviews/submit/', views.submit_review, name='submit_review'),
    path('api/reviews/user/', views.get_user_review, name='get_user_review'),
]
