import React from 'react';
import type { User } from '../types/auth.types';
import { getBlocks, getDistricts } from '../services/masterService';
import { getUserRoleId, ROLE_IDS } from './roleAccess';

type ResolvedScope = {
  districtName: string;
  blockName: string;
  scopedUser: User | null;
};

export const useResolvedScope = (user: User | null): ResolvedScope => {
  const [districtName, setDistrictName] = React.useState(user?.districtName ?? '');
  const [blockName, setBlockName] = React.useState(user?.blockName ?? '');
  const roleId = getUserRoleId(user);

  React.useEffect(() => {
    const nextDistrictName = user?.districtName ?? '';
    const nextBlockName = user?.blockName ?? '';

    setDistrictName((current) => (current === nextDistrictName ? current : nextDistrictName));
    setBlockName((current) => (current === nextBlockName ? current : nextBlockName));
  }, [user?.blockName, user?.districtName]);

  React.useEffect(() => {
    if (!user || roleId === ROLE_IDS.STATE_ADMIN) {
      return;
    }

    let cancelled = false;

    const resolveScope = async () => {
      let resolvedDistrictName = user.districtName ?? '';
      let resolvedBlockName = user.blockName ?? '';

      if (!resolvedDistrictName && user.districtId) {
        try {
          const districts = await getDistricts();
          const matchedDistrict = districts.find(
            (district) => String(district.districtId) === String(user.districtId),
          );
          resolvedDistrictName = matchedDistrict?.districtName ?? String(user.districtId);
        } catch {
          resolvedDistrictName = String(user.districtId);
        }
      }

      if (!resolvedBlockName && user.blockId) {
        try {
          if (user.districtId) {
            const blocks = await getBlocks(user.districtId);
            const matchedBlock = blocks.find((block) => String(block.blockId) === String(user.blockId));
            resolvedBlockName = matchedBlock?.blockName ?? String(user.blockId);
          } else {
            resolvedBlockName = String(user.blockId);
          }
        } catch {
          resolvedBlockName = String(user.blockId);
        }
      }

      if (!cancelled) {
        setDistrictName((current) => (current === resolvedDistrictName ? current : resolvedDistrictName));
        setBlockName((current) => (current === resolvedBlockName ? current : resolvedBlockName));
      }
    };

    void resolveScope();

    return () => {
      cancelled = true;
    };
  }, [roleId, user?.blockId, user?.blockName, user?.districtId, user?.districtName]);

  const scopedUser = React.useMemo(() => {
    if (!user) {
      return null;
    }

    return {
      ...user,
      districtName: districtName || user.districtName,
      blockName: blockName || user.blockName,
    };
  }, [blockName, districtName, user]);

  return {
    districtName,
    blockName,
    scopedUser,
  };
};
