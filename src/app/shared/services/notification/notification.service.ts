import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  success(title: string, text = '', timer = 3600): void {
    this.showToast('success', title, text, timer);
  }

  error(title: string, text = '', timer = 5000): void {
    this.showToast('error', title, text, timer);
  }

  warning(title: string, text = '', timer = 4200): void {
    this.showToast('warning', title, text, timer);
  }

  info(title: string, text = '', timer = 3600): void {
    this.showToast('info', title, text, timer);
  }

  toast(message: string, icon: SweetAlertIcon = 'success', timer = 3200): void {
    this.showToast(icon, message, '', timer);
  }

  loading(title = 'Working…', text = 'Please wait while we complete this action.'): void {
    Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        container: 'app-notification-container',
        popup: 'app-notification-modal',
      },
      didOpen: () => Swal.showLoading(),
    });
  }

  close(): void {
    Swal.close();
  }

  handleError(error: unknown, fallbackTitle = 'Something went wrong', fallbackText = 'Please try again.'): void {
    const response = error as { error?: { message?: string; error?: { message?: string } }; message?: string };
    const message = response?.error?.error?.message || response?.error?.message || response?.message || fallbackText;
    this.error(fallbackTitle, message);
  }

  private showToast(
    icon: SweetAlertIcon,
    title: string,
    text: string,
    timer: number,
  ): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      title,
      text,
      timer,
      icon,
      timerProgressBar: true,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        container: 'app-notification-container',
        popup: 'app-notification-toast',
      },
      showClass: { popup: 'swal2-show app-notification-enter' },
      hideClass: { popup: 'swal2-hide app-notification-leave' },
    });
  }

  confirm(
    title: string,
    confirmButtonText: string = 'Yes',
    denyButtonText: string = 'No'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText,
      denyButtonText,
      customClass: {
        container: 'app-notification-container',
        popup: 'app-notification-modal',
        confirmButton: 'app-notification-confirm',
        denyButton: 'app-notification-deny',
      },
    });
  }
}
