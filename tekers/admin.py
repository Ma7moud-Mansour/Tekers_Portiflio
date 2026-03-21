from django.contrib import admin
from .models import Category, Technology, Project, Review

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Technology)
class TechnologyAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_featured', 'created_at')
    list_filter = ('category', 'is_featured', 'technologies')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('technologies',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'rating', 'is_approved', 'created_at', 'updated_at')
    list_filter = ('is_approved', 'rating', 'created_at')
    search_fields = ('user_name', 'user_email', 'comment')
    readonly_fields = ('google_id', 'user_name', 'user_email', 'user_avatar', 'created_at', 'updated_at')
    list_editable = ('is_approved',)
    ordering = ('-created_at',)

