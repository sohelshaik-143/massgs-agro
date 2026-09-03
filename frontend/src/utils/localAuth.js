// Local & Offline Authentication Helper for MASSGS Agro

export const DEMO_USERS = [
  {
    massgsId: 'MASSGS-F-8K42P7Q9',
    fullName: 'Venkat Farmer',
    email: 'farmer.venkat@massgs.com',
    phoneNumber: '9123456780',
    role: 'ROLE_FARMER',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    password: 'password123',
    token: 'demo-farmer-session-token',
    userId: 1,
    roleEntityId: 1,
  },
  {
    massgsId: 'MASSGS-B-4H91XK27',
    fullName: 'Coastal Agro Procurement',
    email: 'procurement@coastalagro.com',
    phoneNumber: '9876543210',
    role: 'ROLE_BUYER',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    password: 'password123',
    token: 'demo-buyer-session-token',
    userId: 2,
    roleEntityId: 2,
  },
];

const LOCAL_STORAGE_KEY = 'massgs_local_registered_users';

export function getLocalRegisteredUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function saveLocalRegisteredUsers(users) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
  } catch (_) {}
}

export function registerLocalUser({ fullName, email, phoneNumber, password, role, district = 'Guntur', state = 'Andhra Pradesh' }) {
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
  const localUsers = getLocalRegisteredUsers();

  // Check duplicates in local registered users and demo users
  const isDuplicateInDemo = DEMO_USERS.some(u =>
    (cleanEmail && u.email.toLowerCase() === cleanEmail) ||
    (cleanPhone && u.phoneNumber === cleanPhone)
  );

  const isDuplicateInLocal = localUsers.some(u =>
    (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
    (cleanPhone && u.phoneNumber && u.phoneNumber === cleanPhone)
  );

  if (isDuplicateInDemo || isDuplicateInLocal) {
    throw new Error('An account with this email address or mobile number already exists.');
  }

  const prefix = role === 'ROLE_BUYER' ? 'MASSGS-B-' : 'MASSGS-F-';
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let uniqueCode = '';
  for (let i = 0; i < 8; i++) {
    uniqueCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const massgsId = prefix + uniqueCode;

  const newUser = {
    id: Date.now(),
    massgsId,
    fullName: fullName.trim(),
    email: cleanEmail || `user-${massgsId.toLowerCase().replace(/[^a-z0-9]/g, '')}@massgs.local`,
    phoneNumber: cleanPhone,
    password: password,
    role: role || 'ROLE_FARMER',
    district: district || 'Guntur',
    state: state || 'Andhra Pradesh',
    createdAt: new Date().toISOString(),
  };

  localUsers.push(newUser);
  saveLocalRegisteredUsers(localUsers);

  return {
    ...newUser,
    token: 'local-jwt-session-' + Date.now(),
    userId: newUser.id,
    roleEntityId: newUser.id,
  };
}

export function loginLocalUser(identifier, password) {
  if (!identifier || !password) {
    return { success: false, message: 'Please enter your email/mobile and password.' };
  }

  const cleanInput = identifier.trim().toLowerCase();
  const digitsOnly = cleanInput.replace(/[^0-9]/g, '');

  // 1. Check Demo Accounts
  for (const demo of DEMO_USERS) {
    const isIdMatch = demo.massgsId.toLowerCase() === cleanInput ||
                      demo.massgsId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanInput.replace(/[^a-z0-9]/g, '');
    const isEmailMatch = demo.email.toLowerCase() === cleanInput;
    const isPhoneMatch = digitsOnly.length >= 10 && demo.phoneNumber.endsWith(digitsOnly.slice(-10));
    const isKeywordMatch = (cleanInput.includes('farmer') && demo.role === 'ROLE_FARMER') ||
                           (cleanInput.includes('buyer') && demo.role === 'ROLE_BUYER') ||
                           (cleanInput === '9123456780' && demo.role === 'ROLE_FARMER') ||
                           (cleanInput === '9876543210' && demo.role === 'ROLE_BUYER');

    if (isIdMatch || isEmailMatch || isPhoneMatch || isKeywordMatch) {
      const acceptedPasswords = ['password123', 'farmer123', 'buyer123', 'password', '123456', demo.password];
      if (acceptedPasswords.includes(password)) {
        return {
          success: true,
          user: {
            ...demo,
            token: demo.token || 'demo-session-' + Date.now(),
          },
        };
      } else {
        return { success: false, message: 'Invalid credentials. Please check your email/mobile and password.' };
      }
    }
  }

  // 2. Check Local Registered Accounts
  const localUsers = getLocalRegisteredUsers();
  const matched = localUsers.find(u => {
    const uEmail = (u.email || '').toLowerCase();
    const uId = (u.massgsId || '').toLowerCase();
    const uPhone = (u.phoneNumber || '').replace(/[^0-9]/g, '');

    return uEmail === cleanInput ||
           uId === cleanInput ||
           (digitsOnly && uPhone && (uPhone === digitsOnly || (digitsOnly.length >= 10 && uPhone.endsWith(digitsOnly.slice(-10)))));
  });

  if (matched) {
    if (matched.password && matched.password !== password) {
      return { success: false, message: 'Invalid credentials. Please check your email/mobile and password.' };
    }
    return {
      success: true,
      user: {
        token: 'local-jwt-session-' + Date.now(),
        massgsId: matched.massgsId,
        fullName: matched.fullName,
        email: matched.email,
        phoneNumber: matched.phoneNumber,
        role: matched.role,
        userId: matched.id,
        district: matched.district || 'Guntur',
        state: matched.state || 'Andhra Pradesh',
        roleEntityId: matched.id,
      },
    };
  }

  return { success: false, message: 'Invalid credentials. Please check your email/mobile and password.' };
}
