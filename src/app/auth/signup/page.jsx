'use client'

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AuthForm from '@/app/components/authForm';

export default function LoginPage() {
    const router = useRouter();
    async function handleSubmit(prevFormState, formData) {
        const email = formData.get('email');
        const password = formData.get('password');

        let errors = [];

        if (!email.includes('@')) {
            errors.push('invalid email Address.');
        }

        if (password == null || password.length <= 6) {
            errors.push('You mast provide a password with at least six characters');
        }

        try {
            const response = await fetch('/api/user/', {
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email, password
                })
            });

            const body = await response.json();

            if (!response.ok || response.status !== 201) {
                throw new Error(body.message);
            }

        } catch (error) {
            errors.push(error.message || 'Error creating user');
        }

        if (errors.length > 0) {
            return {
                errors: errors,
                enteredValues: {
                    email,
                    password,
                }
            }
        } else {
            router.push('/auth/signin');
        }
        return { errors: null };
    }

    const link = <Link href="/auth/signin/" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-cyan-400">Login</Link>;

    return (
        <AuthForm textButton='Sign Up' handleSubmit={handleSubmit} link={link}>
            <Image
                alt="Situation in the city"
                src="/logo.svg"
                className="mx-auto h-40 w-auto"
                width="160" height="160"
            />
            <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-amber-300">
                Create an account
            </h2>
        </AuthForm>
    )
}
