from django.urls import path
from .views import blur_image

urlpatterns = [
    path("blur/", blur_image, name="blur_image"),
]
