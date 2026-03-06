// ===================================================================
// UTILS - Helper függvények
// ===================================================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Verification email küldése a backenden keresztül
 * A backend Firebase Admin SDK-val írja a Firestore-ba
 * @param {string} email - User email címe
 * @param {string} displayName - User neve
 * @param {string} phone - User telefonszáma
 * @param {string} uid - User Firebase UID
 */
export const sendVerificationEmail = async (email, displayName, phone, uid) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/send-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        displayName,
        phone,
        uid
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send verification email');
    }

    return data;
  } catch (error) {
    console.error('❌ Error in sendVerificationEmail:', error);
    throw error;
  }
};

/**
 * Password reset email küldése a backenden keresztül
 * @param {string} email - User email címe
 */
export const sendPasswordResetEmail = async (email) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/send-password-reset-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send password reset email');
    }

    return data;
  } catch (error) {
    console.error('❌ Error in sendPasswordResetEmail:', error);
    throw error;
  }
};

/**
 * Google user mentése Firestore-ba a backenden keresztül
 * @param {string} uid - User Firebase UID
 * @param {string} email - User email címe
 * @param {string} displayName - User neve
 * @param {string} phone - User telefonszáma (opcionális)
 */
export const saveGoogleUser = async (uid, email, displayName, phone = '') => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/save-google-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        uid,
        email,
        displayName,
        phone
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save Google user');
    }

    return data;
  } catch (error) {
    console.error('❌ Error in saveGoogleUser:', error);
    throw error;
  }
};