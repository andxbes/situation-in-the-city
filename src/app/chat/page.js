'use client'
import { useSession, signOut } from 'next-auth/react';
import withRoleAuth from '../components/ProtectedRoute';
function Page(params) {
    const { data: session } = useSession();
    return (
        <>
            <div>
                <h1>Чат </h1>
                <p>Добро пожаловать, {session?.user?.email}!</p>
                <button onClick={() => signOut()}>Выйти</button>
            </div>
        </>
    );
};




export default withRoleAuth(Page, ['admin', 'user']);
