/**
 * Admin authentication middleware
 * Protects admin routes by checking for valid session
 */
export async function adminAuth(request, reply) {
  if (!request.session || !request.session.adminId) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Please log in to access this resource' })
    return
  }

  const { sql } = request.server
  const [admin] = await sql`
    select id, email, name, role, is_active
    from admins
    where id = ${request.session.adminId}
  `

  if (!admin || !admin.isActive) {
    request.session.destroy()
    reply.code(401).send({ error: 'Unauthorized', message: 'Admin account not found or inactive' })
    return
  }

  request.admin = admin
}
