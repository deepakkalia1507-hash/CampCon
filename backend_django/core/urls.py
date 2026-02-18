from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, PlacementViewSet, EventViewSet, CompetitionViewSet, PlacementRegistrationViewSet, EventRegistrationViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'placements', PlacementViewSet)
router.register(r'events', EventViewSet)
router.register(r'competitions', CompetitionViewSet)
router.register(r'registrations/placements', PlacementRegistrationViewSet)
router.register(r'registrations/events', EventRegistrationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
