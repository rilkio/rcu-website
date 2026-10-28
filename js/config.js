/* Zentrale Einstellungen der Website.
   SUPABASE_KEY ist der öffentliche "publishable" Schlüssel – er darf im Browser stehen.
   Niemals einen service_role- oder anderen geheimen Schlüssel hier eintragen (auch keinen Shopify-Admin-Token)!
   DOWNLOAD_URL: Link zur RCU-Setup-Datei (liegt im Ordner download/). Bei einer neuen Version Datei austauschen und hier den Namen ändern.
   Solange leer, zeigt der Button "Download bald verfügbar".
   SHOP_PREMIUM_URL: Shopify-Warenkorb-Link für Premium, z. B. https://DEINSHOP.myshopify.com/cart/VARIANTEN_ID:1
     Solange leer, zeigt der Premium-Button "Bald verfügbar".
   PREMIUM_PRICE: Preis als Text, z. B. "9,99 €". Solange leer, steht dort "Preis folgt". */
window.RCU_CONFIG = {
  SUPABASE_URL: 'https://ivekefjfhxkozczodwxd.supabase.co',
  SUPABASE_KEY: 'sb_publishable_eg-4ALpYHD2_pV6WUBfNeQ_5a9MrsEU',
  DOWNLOAD_URL: 'download/RCU-Setup-1.3.0.exe',
  SHOP_PREMIUM_URL: '',
  PREMIUM_PRICE: '49,99 €'
};
