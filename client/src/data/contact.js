// Enquiries from the design cards open WhatsApp chat with this number.
// Country code first (91 = India), then the 10-digit number, digits only. Change it here if the number changes.
export const WHATSAPP_NUMBER = "917803008431";

export const whatsappLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
