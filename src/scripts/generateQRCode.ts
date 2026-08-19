import QRCode from "qrcode";
import dotenv from "dotenv";

dotenv.config();

async function generateQRCode() {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    console.error("FRONTEND_URL manquant dans le .env");
    process.exit(1);
  }

  // /commande, pas /order : la route du front est (public)/commande/page.tsx.
  // Tout QR déjà imprimé pointe vers un 404 et est à réimprimer.
  const targetUrl = `${frontendUrl}/commande`;
  const outputPath = "qrcode-commande.png";

  try {
    await QRCode.toFile(outputPath, targetUrl, {
      width: 500,
      margin: 2,
    });

    console.log(`QR Code généré avec succès : ${outputPath}`);
    console.log(`Il pointe vers : ${targetUrl}`);
  } catch (error) {
    console.error("Erreur lors de la génération du QR Code :", error);
    process.exit(1);
  }
}

generateQRCode();
