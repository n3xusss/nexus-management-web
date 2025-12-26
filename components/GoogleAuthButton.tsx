// components/GoogleAuthButton.tsx - FIXED WITH CORRECT REDIRECT URI
'use client';

interface GoogleAuthButtonProps {
  inviteToken?: string;
  isNewUser?: boolean;
  onClick?: () => void;
}

export default function GoogleAuthButton({ 
  inviteToken, 
  isNewUser = false,
  onClick 
}: GoogleAuthButtonProps) {
  
  const handleGoogleAuth = () => {
    if (onClick) {
      onClick();
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      console.error('Missing Google OAuth configuration');
      return;
    }

    // Store invite token if provided
    if (inviteToken) {
      localStorage.setItem('pending_invite_token', inviteToken);
      sessionStorage.setItem('pending_invite_token', inviteToken);
      console.log('🔍 Stored invite token for new user:', inviteToken);
    }

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,  // MUST match exactly what's in Google Cloud Console
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    console.log('🔍 Redirecting to Google OAuth:', {
      hasInviteToken: !!inviteToken,
      redirectUri,
      isNewUser
    });
    
    window.location.href = googleAuthUrl;
  };

  return (
    <button
      onClick={handleGoogleAuth}
      className="w-full bg-gradient-to-r from-[#7CFC9D] to-[#4CAF50] text-black font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#7CFC9D]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group cursor-pointer"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span className="font-semibold">Continue with Google</span>
    </button>
  );
}