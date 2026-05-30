import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import gnDivisionsData from '../data/gnDivisions.json';

// Step Progress Indicator
const StepIndicator = ({ current }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const steps = ['About You', 'Contact', 'Password'];

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'center', 
      gap: isMobile ? '4px' : '0', 
      marginBottom: '28px' 
    }}>
      {steps.map((label, i) => {
        const index = i + 1;
        const isDone = current > index;
        const isActive = current === index;

        return (
          <React.Fragment key={index}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              width: isMobile ? '70px' : '90px' 
            }}>
              <div style={{
                width: isMobile ? '32px' : '36px', 
                height: isMobile ? '32px' : '36px', 
                borderRadius: '50%',
                backgroundColor: '#1a1a1a',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '3px solid #1a1a1a',
              }}>
                {isDone ? (
                  <svg width={isMobile ? '14' : '18'} height={isMobile ? '14' : '18'} viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive ? (
                  <div style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px', borderRadius: '50%', backgroundColor: 'white' }} />
                ) : (
                  <div style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px', borderRadius: '50%', backgroundColor: '#555' }} />
                )}
              </div>
              <span style={{ 
                fontSize: isMobile ? '10px' : '12px', 
                fontWeight: 500, 
                color: '#444', 
                marginTop: '6px', 
                textAlign: 'center' 
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: '2px', 
                flex: 1, 
                backgroundColor: '#1a1a1a',
                marginTop: isMobile ? '15px' : '17px',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Shared input style
const inp = (isMobile, hasError = false) => ({
  fontFamily: 'Nunito, system-ui, sans-serif',
  width: '100%',
  padding: isMobile ? '14px 16px' : '13px 16px',
  fontSize: isMobile ? '15px' : '14px',
  fontWeight: 500,
  color: '#1a1a1a',
  backgroundColor: '#ffffff',
  border: `1.5px solid ${hasError ? '#e05050' : '#d4c9a8'}`,
  borderRadius: '10px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
});

const labelStyle = (isMobile) => ({
  fontFamily: 'Nunito, system-ui, sans-serif',
  display: 'block',
  fontSize: isMobile ? '14px' : '13px',
  fontWeight: 700,
  color: '#1a1a1a',
  marginBottom: '7px',
});

// Dark brown pill button
const DarkBtn = ({ onClick, children, type = 'button', isMobile, disabled = false }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      backgroundColor: disabled ? '#8a6a40' : '#3d2000',
      color: '#ffffff',
      border: 'none',
      borderRadius: '999px',
      padding: isMobile ? '12px 20px' : '13px 28px',
      fontSize: isMobile ? '14px' : '14px',
      fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.15s',
      width: isMobile ? 'auto' : 'auto',
    }}
    onMouseOver={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = '#5a3010'; }}
    onMouseOut={(e)  => { if (!disabled) e.currentTarget.style.backgroundColor = '#3d2000'; }}
  >
    {children}
  </button>
);

// Yellow pill button
const YellowBtn = ({ onClick, children, disabled = false, isMobile }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      backgroundColor: disabled ? '#e0c060' : '#F5C400',
      color: '#3d2000',
      border: 'none',
      borderRadius: '999px',
      padding: isMobile ? '12px 20px' : '13px 28px',
      fontSize: isMobile ? '14px' : '14px',
      fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.15s',
      width: isMobile ? 'auto' : 'auto',
    }}
    onMouseOver={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = '#d4a800'; }}
    onMouseOut={(e)  => { if (!disabled) e.currentTarget.style.backgroundColor = disabled ? '#e0c060' : '#F5C400'; }}
  >
    {children}
  </button>
);

// Privacy note
const PrivacyNote = ({ isMobile }) => (
  <div style={{
    backgroundColor: '#fdf8e1',
    border: '1px solid #e8d87a',
    borderRadius: '10px',
    padding: isMobile ? '12px 14px' : '12px 18px',
    marginTop: '20px',
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: 500,
    color: '#5a4a10',
    textAlign: 'center',
  }}>
    We take your privacy seriously. Your data is encrypted and used only for official verification purposes.
  </div>
);

const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// COMPLETE DISTRICT_DS_MAP - All 25 Districts of Sri Lanka
const DISTRICT_DS_MAP = {
  'Colombo': ['Colombo', 'Dehiwala', 'Homagama', 'Kaduwela', 'Kesbewa', 'Kolonnawa', 'Kotte', 'Maharagama', 'Moratuwa', 'Padukka', 'Seethawaka', 'Thimbirigasyaya'],
  'Gampaha': ['Attanagalla', 'Biyagama', 'Divulapitiya', 'Dompe', 'Gampaha', 'Ja-Ela', 'Katana', 'Kelaniya', 'Mahara', 'Minuwangoda', 'Mirigama', 'Negombo', 'Wattala'],
  'Kalutara': ['Agalawatta', 'Bandaragama', 'Beruwala', 'Bulathsinhala', 'Dodangoda', 'Horana', 'Ingiriya', 'Kalutara', 'Madurawela', 'Mathugama', 'Millaniya', 'Palindanuwara', 'Panadura', 'Walallawita'],
  'Kandy': ['Akurana', 'Delthota', 'Doluwa', 'Ganga Ihala Korale', 'Harispattuwa', 'Hatharaliyadda', 'Kandy', 'Kundasale', 'Medadumbara', 'Minipe', 'Panvila', 'Pasbage Korale', 'Pathadumbara', 'Pathahewaheta', 'Poojapitiya', 'Thumpane', 'Udadumbara', 'Udapalatha', 'Ududumbara'],
  'Matale': ['Ambanganga Korale', 'Dambulla', 'Galewela', 'Laggala-Pallegama', 'Matale', 'Naula', 'Pallepola', 'Rattota', 'Ukuwela', 'Wilgamuwa', 'Yatawatta'],
  'Nuwara Eliya': ['Ambagamuwa', 'Hanguranketha', 'Kotmale', 'Nuwara Eliya', 'Walapane'],
  'Galle': ['Akmeemana', 'Ambalangoda', 'Balapitiya', 'Baddegama', 'Benthota', 'Bope-Poddala', 'Elpitiya', 'Galle', 'Gonapinuwala', 'Hikkaduwa', 'Imaduwa', 'Karandeniya', 'Nagoda', 'Neluwa', 'Niyagama', 'Poddala', 'Welivitiya-Divithura', 'Yakkalamulla'],
  'Matara': ['Akuressa', 'Athuraliya', 'Devinuwara', 'Dickwella', 'Hakmana', 'Kamburupitiya', 'Kirinda Puhulwella', 'Kotapola', 'Malimbada', 'Matara', 'Mulatiyana', 'Pasgoda', 'Pitabeddara', 'Thihagoda', 'Weligama', 'Welipitiya'],
  'Hambantota': ['Ambalantota', 'Angunakolapelessa', 'Beliatta', 'Hambantota', 'Katuwana', 'Lunugamvehera', 'Okewela', 'Sooriyawewa', 'Tangalle', 'Thissamaharama', 'Weeraketiya', 'Walasmulla'],
  'Jaffna': ['Delft', 'Island North', 'Island South', 'Jaffna', 'Karainagar', 'Nallur', 'Thenmaradchi', 'Vadamaradchi East', 'Vadamaradchi North', 'Vadamaradchi South-West', 'Valikamam East', 'Valikamam North', 'Valikamam South', 'Valikamam South-West', 'Valikamam West'],
  'Kilinochchi': ['Kandawalai', 'Karachchi', 'Pachchilaipalli', 'Poonakary'],
  'Mannar': ['Madhu', 'Mannar', 'Musalai', 'Nanaddan'],
  'Mullaitivu': ['Maritimepattu', 'Oddusuddan', 'Puthukudiyiruppu', 'Thunukkai', 'Welioya'],
  'Vavuniya': ['Vavuniya', 'Vavuniya North', 'Vavuniya South', 'Vengalacheddikulam'],
  'Trincomalee': ['Kantalai', 'Kinniya', 'Kuchchaveli', 'Morawewa', 'Muttur', 'Padavi Sripura', 'Seruwila', 'Thambalagamuwa', 'Trincomalee', 'Verugal'],
  'Batticaloa': ['Eravur Pattu', 'Eravur Town', 'Kattankudy', 'Koralai Pattu', 'Koralai Pattu Central', 'Koralai Pattu North', 'Koralai Pattu South', 'Koralai Pattu West', 'Manmunai North', 'Manmunai Pattu', 'Manmunai South and Eruvil Pattu', 'Manmunai West', 'Porativu Pattu'],
  'Ampara': ['Addalaichenai', 'Akkaraipattu', 'Ampara', 'Damana', 'Dehiattakandiya', 'Irakkamam', 'Kalmunai', 'Kalmunai Muslim', 'Karaitivu', 'Lahugala', 'Mahaoya', 'Navithanveli', 'Nintavur', 'Padiyathalawa', 'Pothuvil', 'Samanthurai', 'Thirukovil', 'Uhana'],
  'Kurunegala': ['Alawwa', 'Ambanpola', 'Bamunakotuwa', 'Bingiriya', 'Dodangaslanda', 'Ehetuwewa', 'Galgamuwa', 'Ganewatta', 'Giribawa', 'Ibbagamuwa', 'Katugampola', 'Kobeigane', 'Kotavehera', 'Kuliyapitiya East', 'Kuliyapitiya West', 'Kurunegala', 'Mahawa', 'Mallawapitiya', 'Maspotha', 'Mawathagama', 'Narammala', 'Nikaweratiya', 'Panduwasnuwara', 'Pannala', 'Polgahawela', 'Polpithigama', 'Rasnayakapura', 'Rideegama', 'Udubaddawa', 'Wariyapola', 'Weerambugedara'],
  'Puttalam': ['Anamaduwa', 'Arachchikattuwa', 'Chilaw', 'Dankotuwa', 'Kalpitiya', 'Karuwalagaswewa', 'Mahakumbukkadawala', 'Mahawewa', 'Mundel', 'Nattandiya', 'Nawagattegama', 'Pallama', 'Puttalam', 'Vanathavilluwa', 'Wennappuwa'],
  'Anuradhapura': ['Dimbulagala', 'Eppawala', 'Galnewa', 'Galenbindunuwewa', 'Horowupotana', 'Ipalogama', 'Kahatagasdigiliya', 'Kebithigollewa', 'Kekirawa', 'Mahavilachchiya', 'Medawachchiya', 'Mihintale', 'Nachchaduwa', 'Nochchiyagama', 'Nuwaragam Palatha Central', 'Nuwaragam Palatha East', 'Padaviya', 'Palagala', 'Rajanganaya', 'Rambewa', 'Thalawa', 'Thirappane', 'Thambuththegama'],
  'Polonnaruwa': ['Dimbulagala', 'Elahera', 'Hingurakgoda', 'Lankapura', 'Medirigiriya', 'Polonnaruwa', 'Thamankaduwa', 'Welikanda'],
  'Badulla': ['Badulla', 'Bandarawela', 'Ella', 'Hali-Ela', 'Haputale', 'Kandaketiya', 'Lunugala', 'Mahiyanganaya', 'Meegahakivula', 'Passara', 'Ridimaliyadda', 'Soranathota', 'Uva-Paranagama', 'Welimada'],
  'Moneragala': ['Bibile', 'Buttala', 'Katharagama', 'Madulla', 'Medagama', 'Moneragala', 'Siyambalanduwa', 'Thanamalvila', 'Wellawaya'],
  'Ratnapura': ['Ayagama', 'Balangoda', 'Eheliyagoda', 'Elapatha', 'Embilipitiya', 'Godakawela', 'Imbulpe', 'Kahawatta', 'Kalawana', 'Kiriella', 'Kolonna', 'Kuruvita', 'Nivithigala', 'Opanayaka', 'Pelmadulla', 'Ratnapura', 'Weligepola'],
  'Kegalle': ['Aranayaka', 'Bulathkohupitiya', 'Deraniyagala', 'Dehiovita', 'Galigamuwa', 'Kegalle', 'Mawanella', 'Rambukkana', 'Ruwanwella', 'Warakapola', 'Yatiyanthota'],
};

// STEP 1 — About You with NIC Uniqueness Check (Using Document ID - NO INDEX NEEDED)
const Step1 = ({ data, onChange, onNext }) => {
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [nicAvailable, setNicAvailable] = useState(true);
  const [checkingNic, setCheckingNic] = useState(false);
  const nicCheckTimeout = React.useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkNicUniqueness = async (nicValue) => {
    const normalized = nicValue.trim().toUpperCase(); // ← add this
    
    if (!normalized || normalized.length < 9) {
      setNicAvailable(true);
      setErrors(prev => ({ ...prev, nic: undefined }));
      return;
    }

    const isValidFormat = /^(\d{9}[VX]|\d{12})$/.test(normalized); // uppercase only
    if (!isValidFormat) {
      setErrors(prev => ({ ...prev, nic: 'Enter a valid NIC (9 digits+V/X or 12 digits).' }));
      setNicAvailable(false);
      return;
    }

    setCheckingNic(true);
    try {
      const nicQuery = query(collection(db, 'users'), where('nic', '==', normalized));
      const snapshot = await getDocs(nicQuery);
      const exists = !snapshot.empty;
      setNicAvailable(!exists);
      if (exists) {
        setErrors(prev => ({ ...prev, nic: 'This NIC is already registered. Please contact support.' }));
      } else {
        setErrors(prev => ({ ...prev, nic: undefined }));
      }
    } catch (error) {
      console.error('Error checking NIC:', error);
    } finally {
      setCheckingNic(false);
    }
  };

  const handleNicChange = (e) => {
    const value = e.target.value.toUpperCase();
    onChange('nic', value);

    if (nicCheckTimeout.current) {
      clearTimeout(nicCheckTimeout.current);
    }

    nicCheckTimeout.current = setTimeout(() => {
      checkNicUniqueness(value);
    }, 500);
  };

  const validate = () => {
    const e = {};
    if (!data.fullName.trim())  e.fullName = 'Full name is required.';
    if (!data.nic.trim())       e.nic = 'NIC number is required.';
    else if (!/^(\d{9}[VvXx]|\d{12})$/.test(data.nic.trim()))
      e.nic = 'Enter a valid NIC (9 digits+V/X or 12 digits).';
    else if (!nicAvailable)     e.nic = 'This NIC is already registered. Please contact support.';
    if (!data.dob)              e.dob = 'Date of birth is required.';
    if (!data.address.trim())   e.address = 'Home address is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <h2 style={{ fontSize: isMobile ? '16px' : '17px', fontWeight: 800, color: '#1a1a1a', marginBottom: '22px' }}>
        Personal Details
      </h2>

      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle(isMobile)}>Your Full Name</label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          placeholder="Ruwan Sanjeewa Perera"
          style={inp(isMobile, errors.fullName)}
          onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
          onBlur={(e)  => (e.target.style.borderColor = errors.fullName ? '#e05050' : '#d4c9a8')}
        />
        {errors.fullName && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.fullName}</p>}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '16px', 
        marginBottom: '18px' 
      }}>
        <div>
          <label style={labelStyle(isMobile)}>NIC Number</label>
          <input
            type="text"
            value={data.nic}
            onChange={handleNicChange}
            placeholder="12 digits or 9 digits+V"
            style={inp(isMobile, errors.nic)}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.nic ? '#e05050' : '#d4c9a8')}
          />
          {checkingNic && (
            <p style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
              Checking NIC availability...
            </p>
          )}
          {errors.nic && (
            <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>
              {errors.nic}
            </p>
          )}
          {!errors.nic && data.nic && nicAvailable && data.nic.trim().length >= 9 && !checkingNic && (
            <p style={{ color: '#30a050', fontSize: '12px', marginTop: '4px' }}>
              ✓ NIC is valid and available
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle(isMobile)}>Date of Birth</label>
          <input
            type="date"
            value={data.dob}
            onChange={(e) => onChange('dob', e.target.value)}
            style={{ ...inp(isMobile, errors.dob), color: data.dob ? '#1a1a1a' : '#999' }}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.dob ? '#e05050' : '#d4c9a8')}
          />
          {errors.dob && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.dob}</p>}
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-end', 
        gap: '16px', 
        marginBottom: '4px' 
      }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle(isMobile)}>Your Home Address</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder=""
            style={inp(isMobile, errors.address)}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.address ? '#e05050' : '#d4c9a8')}
          />
          {errors.address && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.address}</p>}
        </div>
        <div style={{ flexShrink: 0 }}>
          <DarkBtn 
            onClick={() => { 
              if (validate()) {
                onNext();
              }
            }} 
            isMobile={isMobile}
            disabled={!nicAvailable || checkingNic}
          >
            Continue →
          </DarkBtn>
        </div>
      </div>

      <PrivacyNote isMobile={isMobile} />
    </div>
  );
};

// STEP 2 — Contact Details with Real GN Divisions
const Step2 = ({ data, onChange, onNext, onBack }) => {
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [gnDivisions, setGnDivisions] = useState([]);
  const [loadingGn, setLoadingGn] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dsDivisions = data.district ? (DISTRICT_DS_MAP[data.district] || []) : [];

  useEffect(() => {
    if (!data.district || !data.dsDiv) {
      setGnDivisions([]);
      return;
    }
    
    setLoadingGn(true);
    try {
      const districtData = gnDivisionsData[data.district];
      if (districtData && districtData[data.dsDiv]) {
        setGnDivisions(districtData[data.dsDiv]);
      } else {
        setGnDivisions([]);
      }
    } catch (error) {
      console.error('Error loading GN divisions:', error);
      setGnDivisions([]);
    } finally {
      setLoadingGn(false);
    }
  }, [data.district, data.dsDiv]);

  const handleDistrictChange = (val) => {
    onChange('district', val);
    onChange('dsDiv', '');
    onChange('gnDiv', '');
  };

  const handleDsDivChange = (val) => {
    onChange('dsDiv', val);
    onChange('gnDiv', '');
  };

  const selectStyle = (hasError) => ({
    ...inp(isMobile, hasError),
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
    cursor: 'pointer',
  });

  const validate = () => {
    const e = {};
    if (!data.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      e.email = 'Enter a valid email.';
    if (!data.mobile.trim()) e.mobile = 'Mobile number is required.';
    if (!data.district) e.district = 'Please select your district.';
    if (!data.dsDiv) e.dsDiv = 'Please select your DS Division.';
    if (!data.gnDiv) e.gnDiv = 'Please select your GN Division.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <h2 style={{ fontSize: isMobile ? '16px' : '17px', fontWeight: 800, color: '#1a1a1a', marginBottom: '22px' }}>
        Contact Details
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '16px', 
        marginBottom: '18px' 
      }}>
        <div>
          <label style={labelStyle(isMobile)}>Email address</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            style={inp(isMobile, errors.email)}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.email ? '#e05050' : '#d4c9a8')}
          />
          {errors.email && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
          {!errors.email && data.email && (
            <p style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
              Each family member needs a unique email address.
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle(isMobile)}>Mobile Number</label>
          <input
            type="tel"
            value={data.mobile}
            onChange={(e) => onChange('mobile', e.target.value)}
            placeholder="0712345678"
            style={inp(isMobile, errors.mobile)}
            onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
            onBlur={(e)  => (e.target.style.borderColor = errors.mobile ? '#e05050' : '#d4c9a8')}
          />
          {errors.mobile && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.mobile}</p>}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', 
        gap: '16px', 
        marginBottom: '28px' 
      }}>
        <div>
          <label style={labelStyle(isMobile)}>Your District</label>
          <select
            value={data.district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            style={selectStyle(errors.district)}
          >
            <option value="">Select district…</option>
            {Object.keys(DISTRICT_DS_MAP).sort().map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.district && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.district}</p>}
        </div>

        <div>
          <label style={labelStyle(isMobile)}>DS Division</label>
          <select
            value={data.dsDiv}
            onChange={(e) => handleDsDivChange(e.target.value)}
            disabled={!data.district}
            style={{
              ...selectStyle(errors.dsDiv),
              opacity: data.district ? 1 : 0.5,
              cursor: data.district ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">{data.district ? 'Select DS Division…' : 'Select district first'}</option>
            {dsDivisions.map((ds) => (
              <option key={ds} value={ds}>{ds}</option>
            ))}
          </select>
          {errors.dsDiv && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.dsDiv}</p>}
        </div>

        <div>
          <label style={labelStyle(isMobile)}>GN Division</label>
          <select
            value={data.gnDiv}
            onChange={(e) => onChange('gnDiv', e.target.value)}
            disabled={!data.dsDiv || loadingGn}
            style={{
              ...selectStyle(false),
              opacity: (data.dsDiv && !loadingGn) ? 1 : 0.5,
              cursor: (data.dsDiv && !loadingGn) ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">
              {loadingGn 
                ? 'Loading GN Divisions...' 
                : (data.dsDiv ? 'Select GN Division…' : 'Select DS Division first')}
            </option>
            {gnDivisions.map((gn) => (
              <option key={gn} value={gn}>{gn}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column-reverse' : 'row',
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: isMobile ? '12px' : '0',
      }}>
        <DarkBtn onClick={onBack} isMobile={isMobile}>← Back</DarkBtn>
        <DarkBtn onClick={() => { if (validate()) onNext(); }} isMobile={isMobile}>Continue →</DarkBtn>
      </div>

      <PrivacyNote isMobile={isMobile} />
    </div>
  );
};

// STEP 3 — Password with Email Verification and NIC double-check (Using NIC as Document ID)
const Step3 = ({ data, onChange, onSubmit, onBack }) => {
  const [showPw, setShowPw] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [verificationSent, setVerificationSent] = useState(false);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pwStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = pwStrength(data.password);
  const strengthColors = ['#e05050', '#e05050', '#f0a030', '#3090e0', '#30c060'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const validate = () => {
    const e = {};
    if (!data.username.trim())  e.username = 'Username is required.';
    if (!data.password) e.password = 'Password is required.';
    else if (data.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!data.confirm) e.confirm = 'Please confirm your password.';
    else if (data.password !== data.confirm) e.confirm = "Passwords don't match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    
    try {
      const nicNumber = data.nic.trim();
      
      // Double-check NIC uniqueness using direct document lookup (NO INDEX NEEDED!)
      const nicQuery = query(collection(db, 'users'), where('nic', '==', nicNumber));
      const nicDocSnap = await getDocs(nicQuery);
      if (!nicDocSnap.empty) {
        setErrors({ firebase: 'This NIC number is already registered. Please contact support.' });
        setLoading(false);
        return;
      }
      
      // Create a unique email for Firebase Auth using NIC (required by Firebase)
      // This email is never shown to the user
      const fakeEmail = `${nicNumber}@gramasewa.local`;
      
      // Proceed with account creation
      const credential = await createUserWithEmailAndPassword(auth, fakeEmail, data.password);
      
      // Send email verification to real email (optional)
      if (data.email && data.email.includes('@')) {
        try {
          await sendEmailVerification(credential.user);
        } catch (e) {
          console.warn('Email verification skipped for fake email');
        }
      }
      
      try {
        await updateProfile(credential.user, { displayName: data.username });
      } catch (e) { 
        console.warn('updateProfile failed:', e.message); 
      }

      // Store user data using NIC as the DOCUMENT ID
      try {
        await setDoc(doc(db, 'users', credential.user.uid), {
          uid: credential.user.uid,
          username: data.username,
          fullName: data.fullName,
          nic: nicNumber,
          dob: data.dob,
          address: data.address,
          email: data.email,
          mobile: data.mobile,
          district: data.district,
          dsDiv: data.dsDiv,
          gnDiv: data.gnDiv,
          role: 'citizen',
          createdAt: serverTimestamp(),
          emailVerified: false,
        });
      } catch (firestoreErr) {
        // Rollback: delete the Auth account
        await credential.user.delete();
        throw firestoreErr;
      }
      
      setVerificationSent(true);
      
    } catch (err) {
      let friendlyError;
      
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'System error. Please contact support.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'System error. Please contact support.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'Password is too weak. Use at least 8 characters with letters and numbers.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyError = 'Network error. Please check your connection.';
      } else {
        friendlyError = `Something went wrong: ${err.message}`;
      }
      
      setErrors((prev) => ({ ...prev, firebase: friendlyError }));
    } finally {
      setLoading(false);
    }
  };

  const VerificationSuccess = () => {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '20px' : '30px' }}>
        <div style={{
          width: isMobile ? '70px' : '80px',
          height: isMobile ? '70px' : '80px',
          borderRadius: '50%',
          backgroundColor: '#e6f9ee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width={isMobile ? '32' : '38'} height={isMobile ? '32' : '38'} viewBox="0 0 24 24" fill="none"
            stroke="#28a745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '12px' }}>
          Account Successfully Created!
        </h2>
        <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#555', lineHeight: 1.6, marginBottom: '20px' }}>
          Your Smart Grama Sewa account is now active.<br />
          You can now log in using your <strong>NIC number</strong> as your username.
        </p>
        <p style={{ fontSize: isMobile ? '12px' : '13px', color: '#888', marginBottom: '28px' }}>
          Note: Multiple family members can share the same email address.<br />
          Each person logs in with their own NIC number.
          {data.email && data.email.includes('@') && (
            <span> A verification email has been sent to {data.email}.</span>
          )}
        </p>

        <YellowBtn onClick={() => { window.location.href = '/login'; }} isMobile={isMobile}>
          Go to Login
        </YellowBtn>
      </div>
    );
  };

  if (verificationSent) {
    return <VerificationSuccess />;
  }

  return (
    <div>
      <h2 style={{ fontSize: isMobile ? '16px' : '17px', fontWeight: 800, color: '#1a1a1a', marginBottom: '22px' }}>
        Secure Your Account
      </h2>

      {errors.firebase && (
        <div style={{
          backgroundColor: '#fff0f0',
          border: '1.5px solid #f0a0a0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '18px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#c00',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠</span>
          {errors.firebase}
        </div>
      )}

      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle(isMobile)}>User name (for display)</label>
        <input
          type="text"
          value={data.username}
          onChange={(e) => onChange('username', e.target.value)}
          placeholder="e.g. ruwan_perera92"
          style={{ ...inp(isMobile, errors.username), maxWidth: isMobile ? '100%' : '320px' }}
          onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
          onBlur={(e)  => (e.target.style.borderColor = errors.username ? '#e05050' : '#d4c9a8')}
        />
        {errors.username && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.username}</p>}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '16px', 
        marginBottom: '8px' 
      }}>
        <div>
          <label style={labelStyle(isMobile)}>Create a strong password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => onChange('password', e.target.value)}
              placeholder="Min 8 characters"
              style={{ ...inp(isMobile, errors.password), paddingRight: '44px' }}
              onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
              onBlur={(e)  => (e.target.style.borderColor = errors.password ? '#e05050' : '#d4c9a8')}
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
              <EyeIcon open={showPw} />
            </button>
          </div>
          {data.password && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    height: '4px', flex: 1, borderRadius: '2px',
                    backgroundColor: i <= strength ? strengthColors[strength] : '#ddd',
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '11px', color: strengthColors[strength], fontWeight: 600 }}>
                {strengthLabels[strength]}
              </span>
            </div>
          )}
          {errors.password && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
        </div>
        <div>
          <label style={labelStyle(isMobile)}>Confirm password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConf ? 'text' : 'password'}
              value={data.confirm}
              onChange={(e) => onChange('confirm', e.target.value)}
              placeholder=""
              style={{ ...inp(isMobile, errors.confirm), paddingRight: '44px' }}
              onFocus={(e) => (e.target.style.borderColor = '#B46A02')}
              onBlur={(e)  => (e.target.style.borderColor = errors.confirm ? '#e05050' : '#d4c9a8')}
            />
            <button type="button" onClick={() => setShowConf((v) => !v)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
              <EyeIcon open={showConf} />
            </button>
          </div>
          {data.confirm && data.confirm === data.password && (
            <p style={{ color: '#30a050', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>✓ Passwords match</p>
          )}
          {errors.confirm && <p style={{ color: '#e05050', fontSize: '12px', marginTop: '4px' }}>{errors.confirm}</p>}
        </div>
      </div>

      <p style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>
        You will log in using your NIC number. Keep your password secure.
      </p>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column-reverse' : 'row',
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: isMobile ? '12px' : '0',
      }}>
        <DarkBtn onClick={onBack} isMobile={isMobile}>← Back</DarkBtn>
        <YellowBtn onClick={handleCreate} disabled={loading} isMobile={isMobile}>
          {loading ? 'Creating…' : 'Create Account'}
        </YellowBtn>
      </div>

      <PrivacyNote isMobile={isMobile} />
    </div>
  );
};

// STEP 4 — Success 
const StepSuccess = ({ onDashboard }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: isMobile ? '12px 0 8px' : '12px 0 8px' }}>
      <div style={{
        width: isMobile ? '70px' : '80px',
        height: isMobile ? '70px' : '80px',
        borderRadius: '50%',
        backgroundColor: '#e6f9ee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <svg width={isMobile ? '32' : '38'} height={isMobile ? '32' : '38'} viewBox="0 0 24 24" fill="none"
          stroke="#28a745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '14px' }}>
        Account Successfully Created!
      </h2>
      <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#444', lineHeight: 1.6, marginBottom: '28px' }}>
        Your Smart Grama Sewa account is now active.<br />
        You can now access GN services directly<br />
        from your personal dashboard.
      </p>

      <YellowBtn onClick={onDashboard} isMobile={isMobile}>Go to dashboard</YellowBtn>
    </div>
  );
};

// Main SignUp component
const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [form, setForm] = useState({
    fullName: '', nic: '', dob: '', address: '',
    email: '', mobile: '', district: '', dsDiv: '', gnDiv: '',
    username: '', password: '', confirm: '',
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fefde8',
      fontFamily: 'Nunito, system-ui, sans-serif',
    }}>
      <div style={{ padding: isMobile ? '16px 20px 4px' : '20px 28px 4px' }}>
        <img src="/logo.png" alt="Smart Grama Sewa" style={{ height: isMobile ? '70px' : '100px', width: 'auto' }} />
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isMobile ? '16px 16px 32px' : '16px 16px 48px',
      }}>
        <h1 style={{
          fontSize: isMobile ? '32px' : '44px',
          fontWeight: 900,
          color: '#1a1a1a',
          letterSpacing: '-1px',
          margin: '0 0 24px',
          textAlign: 'center',
        }}>
          Sign Up
        </h1>

        <div style={{ width: '100%', maxWidth: '560px', marginBottom: '8px' }}>
          <StepIndicator current={step > 3 ? 4 : step} />
        </div>

        <div style={{
          width: '100%',
          maxWidth: '760px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: isMobile ? '24px 20px' : '32px 36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}>
          {step === 1 && <Step1 data={form} onChange={update} onNext={() => setStep(2)} />}
          {step === 2 && <Step2 data={form} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3 data={form} onChange={update} onSubmit={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <StepSuccess onDashboard={goToDashboard} />}
        </div>
      </div>

      <footer style={{
        backgroundColor: '#6A2301',
        color: '#ffffff',
        textAlign: 'center',
        padding: isMobile ? '12px 16px' : '14px 16px',
        fontSize: isMobile ? '12px' : '13px',
        fontWeight: 600,
      }}>
        ©2026 Smart Grama Sewa
      </footer>
    </div>
  );
};

export default SignUp;