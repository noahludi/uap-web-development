export const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem('jwt'))
export const setToken = (t: string) => localStorage.setItem('jwt', t)
export const clearToken = () => localStorage.removeItem('jwt')
