
export default function NotAuthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-red-600">Acesso não autorizado</h1>
      <p className="mt-4 text-gray-600">Você não tem permissão para acessar esta página.</p>
    </div>
  );
}