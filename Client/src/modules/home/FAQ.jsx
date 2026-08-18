import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, HelpCircle, ArrowLeft, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const { t, i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  // FAQ data with translation keys
  const faqs = [
    { qKey: "faq_q1", aKey: "faq_a1" },
    { qKey: "faq_q2", aKey: "faq_a2" },
    { qKey: "faq_q3", aKey: "faq_a3" },
    { qKey: "faq_q4", aKey: "faq_a4" },
    { qKey: "faq_q5", aKey: "faq_a5" },
    { qKey: "faq_q6", aKey: "faq_a6" },
    { qKey: "faq_q7", aKey: "faq_a7" },
    { qKey: "faq_q8", aKey: "faq_a8" },
    { qKey: "faq_q9", aKey: "faq_a9" },
    { qKey: "faq_q10", aKey: "faq_a10" },
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  // Get current language display name
  const getCurrentLanguageLabel = () => {
    const langMap = {
      en: 'EN',
      si: 'සිං',
      ta: 'த'
    };
    return langMap[i18n.language] || 'EN';
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with Language Switcher */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-[#6A2301] font-semibold hover:underline">
            <ArrowLeft size={18} /> {t("faq_back_home")}
          </Link>
          
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white border border-[#f0e8d0] rounded-full p-1 shadow-sm">
            <button
              onClick={() => changeLanguage('si')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                i18n.language === 'si' 
                  ? 'bg-[#6A2301] text-white' 
                  : 'text-[#5a3e00] hover:bg-[#f0e8d0]'
              }`}
            >
              සිං
            </button>
            <button
              onClick={() => changeLanguage('ta')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                i18n.language === 'ta' 
                  ? 'bg-[#6A2301] text-white' 
                  : 'text-[#5a3e00] hover:bg-[#f0e8d0]'
              }`}
            >
              த
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                i18n.language === 'en' 
                  ? 'bg-[#6A2301] text-white' 
                  : 'text-[#5a3e00] hover:bg-[#f0e8d0]'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle size={28} color="#6A2301" strokeWidth={2} />
          <h1 className="text-2xl md:text-3xl font-black text-[#3d2a00]">{t("faq_title")}</h1>
        </div>
        <p className="text-sm text-[#7a5c00] mb-8">{t("faq_subtitle")}</p>

        {/* Search Box (Optional) */}
        <div className="mb-6">
          <input
            type="text"
            placeholder={t("faq_search_placeholder")}
            className="w-full p-3 rounded-xl border border-gray-300 focus:border-[#F5C400] focus:outline-none bg-white"
          />
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-[#f0e8d0] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 text-left bg-transparent border-none cursor-pointer hover:bg-[#FFF8E1] transition-colors"
              >
                <span className="font-bold text-[#3d2a00] text-sm">{t(faq.qKey)}</span>
                {openIndex === index ? (
                  <ChevronUp size={18} color="#6A2301" />
                ) : (
                  <ChevronDown size={18} color="#6A2301" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-[#5a3e00] leading-relaxed border-t border-[#f0e8d0] pt-3">{t(faq.aKey)}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-8 p-6 bg-[#6A2301] rounded-2xl text-white text-center">
          <p className="font-bold text-lg mb-2">{t("faq_still_have_questions")}</p>
          <p className="text-sm text-white/80 mb-4">{t("faq_contact_support")}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/login" className="bg-[#FFCB05] text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-yellow-400 transition-colors">
              {t("faq_contact_gn_btn")}
            </Link>
            <Link to="/" className="border border-white/30 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-white/10 transition-colors">
              {t("faq_back_home_btn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;