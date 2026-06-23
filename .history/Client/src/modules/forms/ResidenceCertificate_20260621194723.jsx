// modules/forms/ResidenceCertificate.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, IC } from '../components/icons'; // adjust path

const ResidenceCertificate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    nic: '',
    address: '',
    duration: '',
    purpose: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic (e.g., save to Firestore)
    alert(t('form_submitted_success'));
    navigate('/forms');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/forms')}
        className="flex items-center gap-2 text-user-primary font-extrabold mb-4 hover:underline"
      >
        <Icon d={IC.chevDown} size={16} className="rotate-90" />
        {t('lbl_back_to_forms')}
      </button>

      <div className="bg-user-surface border border-user-border rounded-xl p-6">
        <h2 className="text-2xl font-black text-user-text mb-1">{t('form_residence')}</h2>
        <p className="text-sm text-user-text-lighter mb-6">{t('form_residence_desc')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-user-warning mb-1">
              {t('lbl_full_name')}
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full py-3 px-3.5 text-sm font-semibold border border-user-border rounded-lg outline-none focus:border-user-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-user-warning mb-1">
              {t('lbl_nic_number')}
            </label>
            <input
              type="text"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              className="w-full py-3 px-3.5 text-sm font-semibold border border-user-border rounded-lg outline-none focus:border-user-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-user-warning mb-1">
              {t('lbl_home_address')}
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              className="w-full py-3 px-3.5 text-sm font-semibold border border-user-border rounded-lg outline-none focus:border-user-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-user-warning mb-1">
              {t('lbl_residence_duration')}
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 5 years"
              className="w-full py-3 px-3.5 text-sm font-semibold border border-user-border rounded-lg outline-none focus:border-user-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-user-warning mb-1">
              {t('lbl_purpose')}
            </label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder={t('lbl_purpose_placeholder')}
              className="w-full py-3 px-3.5 text-sm font-semibold border border-user-border rounded-lg outline-none focus:border-user-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/forms')}
              className="py-2.5 px-6 bg-user-secondary rounded-round text-sm font-extrabold text-white hover:bg-user-secondary-dark transition"
            >
              {t('lbl_cancel')}
            </button>
            <button
              type="submit"
              className="py-2.5 px-8 bg-user-primary rounded-round text-sm font-extrabold text-user-text hover:bg-user-primary-dark transition"
            >
              {t('lbl_submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResidenceCertificate;