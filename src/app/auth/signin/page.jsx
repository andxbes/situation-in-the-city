'use client'
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AuthForm from '@/app/components/authForm';
import Link from 'next/link';
// import { useRouter } from 'next/router'

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

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
            errors.push(result.error)
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
            router.push('/dashboard');
        }
        return { errors: null };
    }

    const link = <Link href="/auth/signup/" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-cyan-400">Register</Link>;
    return (
        <AuthForm textButton='Sign In' handleSubmit={handleSubmit} link={link}>
            <Image
                alt="Situation in the city"
                src="/logo.svg"
                className="mx-auto h-40 w-auto"
                width="160" height="160"
            />
            <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-amber-300">
                Sign in to your account
            </h2>
        </AuthForm>
    )
}
