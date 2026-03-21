from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


def mask_email(email):
    """Mask email for privacy display. Handles short usernames safely."""
    try:
        name, domain = email.split('@')
        visible = name[:2] if len(name) > 2 else name[:1]
        return visible + '***@' + domain
    except (ValueError, AttributeError):
        return '***@***.com'


class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
        
    class Meta:
        verbose_name_plural = "Categories"


class Technology(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
        
    class Meta:
        verbose_name_plural = "Technologies"


class Project(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    description = models.TextField()
    image = models.ImageField(upload_to='projects/')
    technologies = models.ManyToManyField(Technology, related_name='projects')
    
    case_study_link = models.URLField(blank=True, null=True)
    github_link = models.URLField(blank=True, null=True)
    live_demo_link = models.URLField(blank=True, null=True)
    
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class Review(models.Model):
    google_id = models.CharField(max_length=255, unique=True, db_index=True)
    user_name = models.CharField(max_length=255)
    user_email = models.CharField(max_length=255)
    user_avatar = models.URLField(max_length=500, blank=True, default='')
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(max_length=1000)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.rating and (self.rating < 1 or self.rating > 5):
            raise ValidationError({'rating': 'Rating must be between 1 and 5.'})

    @property
    def masked_email(self):
        return mask_email(self.user_email)

    def __str__(self):
        return f"{self.user_name} - {self.rating}★"

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['google_id'], name='unique_google_review')
        ]
