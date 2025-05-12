'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const withRoleAuth = (WrappedComponent, allowedRoles) => {
    const Wrapper = (props) => {
        const { data: session, status } = useSession();
        const router = useRouter();
        const isAdmin = session?.user?.role === 'admin';

        useEffect(() => {
            if (status === 'loading') return;

            if (status === 'unauthenticated') {
                router.push('/c-login');
            } else if (allowedRoles && !allowedRoles.includes(session?.user?.role)) {
                router.push('/unauthorized');
            }
        }, [session, status, router, allowedRoles]);

        if (status === 'loading') {
            return <div>Загрузка...</div>;
        }

        if (status === 'unauthenticated' || (allowedRoles && !allowedRoles.includes(session?.user?.role))) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    return Wrapper;
};

export default withRoleAuth;
