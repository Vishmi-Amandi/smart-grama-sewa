import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Verify = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError(t('verify_error_no_token'));
        setVerifying(false);
        return;
      }

      try {
        // Decode the token
        const decoded = atob(decodeURIComponent(token));
        const [uid, email] = decoded.split(':');

        // Get user document
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setError(t('verify_error_user_not_found'));
          setVerifying(false);
          return;
        }

        const userData = userSnap.data();

        // Check if already verified
        if (userData.emailVerified === true) {
          setSuccess(true);
          setVerifying(false);
          setTimeout(() => navigate('/login?verified=true'), 2000);
          return;
        }

        // Verify the email
        await updateDoc(userRef, {
          emailVerified: true,
          verifiedAt: serverTimestamp(),
        });

        setSuccess(true);
        setVerifying(false);

        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000);

      } catch (err) {
        console.error('Verification error:', err);
        setError(t('verify_error_invalid_link'));
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate, t]);

  return (
    <div className="min-h-screen bg-[#fefde8] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">

        <div className="mb-6">
          <img src="/logo2.png" alt={t('app_name')} className="h-16 mx-auto" />
        </div>

        {verifying ? (
          <div>
            <div className="flex justify-center mb-4">
              <Loader2 size={48} className="text-[#6A2301] animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-[#3d2a00] mb-2">{t('verify_verifying_title')}</h2>
            <p className="text-sm text-[#7a5c00]">{t('verify_verifying_desc')}</p>
          </div>
        ) : success ? (
          <div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={40} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#3d2a00] mb-2">{t('verify_success_title')}</h2>
            <p className="text-sm text-[#7a5c00] mb-4">
              {t('verify_success_desc')}
            </p>
            <p className="text-xs text-gray-400">{t('verify_redirecting')}</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle size={40} className="text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#3d2a00] mb-2">{t('verify_failed_title')}</h2>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#6A2301] hover:bg-[#8B2F00] text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              {t('verify_go_to_login')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verify;