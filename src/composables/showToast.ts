import { toastController } from '@ionic/vue'

// Muestra un toast con su color correspondiente
export async function showToast(message: string, color: string) {
  let duration = 2000;
  if (color === "danger" || color === "warning") {
    duration = 4000;
  }

  const toast = await toastController.create({
    message,
    duration: duration,
    color: color,
    position: "bottom",
  });
  await toast.present();
}
