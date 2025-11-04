// Utility functions for authentication and authorization

export const getUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUserRole = () => {
  const user = getUser();
  return user?.role || user?.user?.role || null;
};

export const isSuperAdmin = () => {
  const role = getUserRole();
  // Check for various super admin role formats
  return role === 'super_admin' || 
         role === 'Super Admin' || 
         role === 'superadmin' || 
         role === 'SUPER_ADMIN';
};

export const isAdmin = () => {
  const role = getUserRole();
  return role === 'admin' || 
         role === 'Admin' || 
         role === 'ADMIN' || 
         isSuperAdmin();
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/signin';
};

// Decode JWT token to see payload (for debugging)
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
};

export const logAuthDebugInfo = () => {
  console.log('=== AUTH DEBUG INFO ===');
  console.log('User from localStorage:', getUser());
  console.log('Token from localStorage:', getToken());
  console.log('User role:', getUserRole());
  console.log('Is Super Admin:', isSuperAdmin());
  console.log('Is Admin:', isAdmin());
  
  const token = getToken();
  if (token) {
    console.log('Decoded token:', decodeToken(token));
  }
  console.log('======================');
};
