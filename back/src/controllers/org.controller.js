// import prisma from "../config/db.js";

// /**
//  * Get organization by ID (returns public key only)
//  */
// export const getOrganizationById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const org = await prisma.organization.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         orgCode: true,
//         role: true,
//         name: true,
//         email: true,
//         publicKey: true,
//         createdAt: true,
//         // Do NOT return privateKey
//       },
//     });

//     if (!org) {
//       return res.status(404).json({
//         message: "Organization not found",
//       });
//     }

//     return res.json(org);
//   } catch (err) {
//     console.error("GET ORGANIZATION ERROR:", err);
//     return res.status(500).json({
//       message: "Failed to fetch organization",
//     });
//   }
// };

import prisma from "../config/db.js";

/**
 * Get organization by ID (returns public key only)
 */
export const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    const org = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        orgCode: true,
        role: true,
        name: true,
        email: true,
        publicKey: true,
        createdAt: true,
        // Do NOT return privateKey
      },
    });

    if (!org) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    return res.json(org);
  } catch (err) {
    console.error("GET ORGANIZATION ERROR:", err);
    return res.status(500).json({
      message: "Failed to fetch organization",
    });
  }
};
