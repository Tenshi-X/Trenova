'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function LogoutButton({ className, children }: { className?: string, children?: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);

    const handleLogout = async () => {
        try {
            setLoading(true);
            const supabase = getSupabaseBrowserClient();
            await supabase.auth.signOut();
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout error:', error);
            setLoading(false);
        }
    };

    return (
        <button onClick={handleLogout} disabled={loading} className={className}>
            {children || "Logout"}
        </button>
    );
}
