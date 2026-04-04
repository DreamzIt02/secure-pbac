// ## 📁 `src/config/pbac.config.ts`

import { PolicyEnum } from '../policies/index.js';

/**
 * Unified PBAC configuration file
 * Declare policies once, consume across frontend and backend adapters
 */
export const PBAC_CONFIG = {
  routes: {
    adminDashboard: {
      path: '/admin/dashboard',
      policies: [PolicyEnum.SiteActingAdmin, PolicyEnum.SiteGeneralAdmin],
      checkDefault: true,
    },
    departmentAdmin: {
      path: '/department',
      policies: [PolicyEnum.SiteDepartmentAdmin],
      checkDefault: false,
    },
    publicPage: {
      path: '/public',
      policies: [],
      checkDefault: false,
    },
  },
};

// ## 📁 Backend Factory Usage

// ```ts
// import { createPolicyAdapter } from '../adapters/backendPolicyFactory';
// import { PBAC_CONFIG } from '../config/pbac.config';

// // Express example
// app.get(
//   PBAC_CONFIG.routes.adminDashboard.path,
//   createPolicyAdapter('express', PBAC_CONFIG.routes.adminDashboard.policies, PBAC_CONFIG.routes.adminDashboard.checkDefault),
//   (req, res) => res.json({ message: 'Admin dashboard' })
// );

// // Koa example
// router.get(
//   PBAC_CONFIG.routes.departmentAdmin.path,
//   createPolicyAdapter('koa', PBAC_CONFIG.routes.departmentAdmin.policies),
//   ctx => { ctx.body = { message: 'Department admin access granted' }; }
// );
// ```

// ## 📁 Frontend Factory Usage

// ```ts
// import { createFrontendPolicyAdapter } from '../adapters/frontendPolicyFactory';
// import { PBAC_CONFIG } from '../config/pbac.config';

// // Angular example
// const AdminGuard = createFrontendPolicyAdapter('angular', PBAC_CONFIG.routes.adminDashboard.policies, PBAC_CONFIG.routes.adminDashboard.checkDefault);

// // React example
// const AdminDashboard = () => <h1>Admin Dashboard</h1>;
// export default createFrontendPolicyAdapter('react', PBAC_CONFIG.routes.adminDashboard.policies)(AdminDashboard);

// // Vue example
// {
//   path: PBAC_CONFIG.routes.departmentAdmin.path,
//   component: DepartmentAdminView,
//   meta: { policies: PBAC_CONFIG.routes.departmentAdmin.policies },
//   beforeEnter: createFrontendPolicyAdapter('vue', PBAC_CONFIG.routes.departmentAdmin.policies)
// }
// ```

// ## ✅ Benefits
// - **Single source of truth**: Policies declared once in `pbac.config.ts`.  
// - **Frontend + Backend reuse**: Both factories consume the same config.  
// - **Consistency**: No risk of mismatched policy definitions between client and server.  
// - **Scalability**: Add new routes/policies in one place, adapters automatically consume them.  
