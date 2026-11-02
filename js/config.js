/* Zentrale Einstellungen der Website.
   SUPABASE_KEY ist der öffentliche "publishable" Schlüssel – er darf im Browser stehen.
   Niemals einen service_role- oder anderen geheimen Schlüssel hier eintragen (auch keinen Shopify-Admin-Token)!
   DOWNLOAD_URL: Link zur RCU-Setup-Datei (liegt im Ordner download/). Bei einer neuen Version Datei austauschen und hier den Namen ändern.
   Solange leer, zeigt der Button "Download bald verfügbar".
   SHOP_PREMIUM_URL: Shopify-Warenkorb-Link für Premium, z. B. https://DEINSHOP.myshopify.com/cart/VARIANTEN_ID:1
     Solange leer, zeigt der Premium-Button "Bald verfügbar".
   PREMIUM_PRICE: Preis als Text, z. B. "9,99 €". Solange leer, steht dort "Preis folgt".
   PROMO_UNTIL / PRICE_AFTER: Einführungspreis mit Enddatum (js/promo.js). Shopify-Preis am Stichtag mit umstellen! */
window.RCU_CONFIG = {
  SUPABASE_URL: 'https://ivekefjfhxkozczodwxd.supabase.co',
  SUPABASE_KEY: 'sb_publishable_eg-4ALpYHD2_pV6WUBfNeQ_5a9MrsEU',
  DOWNLOAD_URL: 'download/RCU-Setup-1.3.9.exe',
  SHOP_PREMIUM_URL: 'https://rilkio.myshopify.com/cart/54599070155099:1',
  PREMIUM_PRICE: '29,99 €',
  // Einführungsangebot: bis PROMO_UNTIL gilt PREMIUM_PRICE, danach zeigt die Seite automatisch PRICE_AFTER
  PROMO_UNTIL: '2026-11-30T23:59:59+01:00',
  PRICE_AFTER: '49,99 €'
};
