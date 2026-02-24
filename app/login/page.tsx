import { login, signup } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedSearchParams = await searchParams;
    const error = resolvedSearchParams?.error;
    const success = resolvedSearchParams?.success;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Timekeeping Login</h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-md text-sm text-center">
                        {success}
                    </div>
                )}

                <form className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-sm font-medium text-slate-700">Email:</label>
                        <input id="email" name="email" type="email" required className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-sm font-medium text-slate-700">Password:</label>
                        <input id="password" name="password" type="password" required className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name (Only for Sign Up):</label>
                        <input id="fullName" name="fullName" type="text" className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <button formAction={login} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium">Log in</button>
                        <button formAction={signup} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition font-medium">Sign up</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
