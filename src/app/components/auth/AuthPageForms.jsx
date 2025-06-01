'use client'
import { useState } from "react";
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/app/components/auth/AuthForm';

export default function AuthPageForms() {
    const [isRegisterForm, setIsRegisterForm] = useState(false);
    const router = useRouter();

    function handleChangeForm() {
        setIsRegisterForm((prev) => !prev);
    }

    async function handleSubmitLogin(prevFormState, formData) {
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

    async function handleSubmitRegister(prevFormState, formData) {
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
            router.push('/auth/');
        }
        return { errors: null };
    }

    return (
        <>
            {isRegisterForm && (
                <AuthForm handleSubmit={handleSubmitRegister}
                    title='Create an account'
                    textButton='Sign Up'
                    changeFormHandle={handleChangeForm}
                    changeFormLabel='Login'
                >
                </AuthForm>
            )}
            {!isRegisterForm && (
                <AuthForm textButton='Sign In' handleSubmit={handleSubmitLogin}
                    changeFormHandle={handleChangeForm}
                    changeFormLabel='Register'
                    title='Sign in to your account'
                >
                </AuthForm>
            )}
        </>
    )
};
