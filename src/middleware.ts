import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Este é o "segurança" da nossa aplicação.
export function middleware(request: NextRequest) {
  // 1. Pega o token de autenticação dos cookies do navegador.
  const token = request.cookies.get('auth_token');

  // 2. Pega a URL da página de login.
  const loginUrl = new URL('/login', request.url);

  // 3. Se o usuário está tentando acessar o dashboard SEM um token...
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    // ...ele é redirecionado para a página de login.
    return NextResponse.redirect(loginUrl);
  }

  // 4. Se o usuário está logado (tem um token) e tenta acessar a página de login...
  if (token && request.nextUrl.pathname === '/login') {
    // ...ele é redirecionado para a dashboard, pois já está autenticado.
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. Em todos os outros casos, o acesso é permitido.
  return NextResponse.next();
}

// Define quais rotas serão protegidas pelo middleware.
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
