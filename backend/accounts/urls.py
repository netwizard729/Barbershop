from django.urls import path
from .views import RegisterView, LoginView, MeView, BarbersListView, BarberManageView, BarberDetailView

urlpatterns = [
    path('register/',        RegisterView.as_view(),    name='register'),
    path('login/',           LoginView.as_view(),       name='login'),
    path('me/',              MeView.as_view(),          name='me'),
    path('barbers/',         BarbersListView.as_view(), name='barbers'),
    path('barbers/manage/',  BarberManageView.as_view(),name='barber-manage'),
    path('barbers/<int:pk>/', BarberDetailView.as_view(), name='barber-detail'),
]
