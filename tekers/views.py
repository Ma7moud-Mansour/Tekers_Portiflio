from django.shortcuts import render
from .models import Project

def index(request):
    projects = Project.objects.select_related('category').prefetch_related('technologies').all()
    
    context = {
        'projects': projects,
    }
    return render(request, 'index.html', context)
