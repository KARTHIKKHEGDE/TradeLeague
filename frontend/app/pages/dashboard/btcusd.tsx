import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function BTCUSDRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/livemarket');
  }, [router]);
  return null;
}
