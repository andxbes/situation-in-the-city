'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthPageForms from './auth/AuthPageForms';



const withRoleAuth = (WrappedComponent, allowedRoles) => {
    const Wrapper = (props) => {
        const { data: session, status } = useSession();
        const router = useRouter();

        useEffect(() => {
            if (status === 'loading') return;

            // Redirect if authenticated but role is not allowed
            if (status === 'authenticated' && allowedRoles && !allowedRoles.includes(session?.user?.role)) {
                router.push('/unauthorized');
            }
        }, [session, status, router]);

        if (status === 'loading') {
            return <div>Loading...</div>;
        }

        if (status === 'unauthenticated') {
            return <AuthPageForms />;
        }

        if (status === 'authenticated') {
            if (allowedRoles && !allowedRoles.includes(session?.user?.role)) {
                return null; // Waiting for redirect to /unauthorized
            }
            return <WrappedComponent {...props} />;
        }
    };

    return Wrapper;
};

export default withRoleAuth;
