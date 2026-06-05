const PERMISSIONS = {
  customer: ['cart:manage', 'account:read', 'account:write', 'order:read'],
  admin: ['cart:manage', 'account:read', 'account:write', 'order:read', 'admin:access'],
};

function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: true, message: 'Authentication required' });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    next();
  };
}

module.exports = requirePermission;
