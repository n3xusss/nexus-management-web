// app/components/GoogleAuthButton.tsx - SIMPLIFIED
'use client';

export default function GoogleAuthButton() {
  const handleGoogleAuth = () => {
    // Simple redirect for returning users
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI;
    
    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri!,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    
    console.log('🔍 Redirecting to Google OAuth');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <button
      onClick={handleGoogleAuth}
      className="bg-[#7CFC9D] text-black font-semibold py-4 px-12 rounded-xl text-base transition-all duration-300 hover:bg-[#6ee089] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(124,252,157,0.3)] border-none cursor-pointer inline-block min-w-[200px]"
    >
      Continue with Google
    </button>
  );
}