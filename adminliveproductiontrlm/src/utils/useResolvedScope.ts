import React from 'react';
import type { User } from '../types/auth.types';
import { getBlocks, getDistricts } from '../services/masterService';
import { isLikelyScopeId } from './helpers';
import { getUserRoleId, ROLE_IDS } from './roleAccess';

type ResolvedScope = {
  districtId: string;
  blockId: string;
  districtName: string;
  blockName: string;
  scopedUser: User | null;
};

export const useResolvedScope = (user: User | null): ResolvedScope => {
  const [districtId, setDistrictId] = React.useState(
    isLikelyScopeId(user?.districtId) ? String(user?.districtId) : '',
  );
  const [blockId, setBlockId] = React.useState(
    isLikelyScopeId(user?.blockId) ? String(user?.blockId) : '',
  );
  const [districtName, setDistrictName] = React.useState(user?.districtName ?? '');
  const [blockName, setBlockName] = React.useState(user?.blockName ?? '');
  const roleId = getUserRoleId(user);

  React.useEffect(() => {
    const nextDistrictId = isLikelyScopeId(user?.districtId) ? String(user?.districtId) : '';
    const nextBlockId = isLikelyScopeId(user?.blockId) ? String(user?.blockId) : '';
    const nextDistrictName = user?.districtName ?? '';
    const nextBlockName = user?.blockName ?? '';

    setDistrictId((current) => (current === nextDistrictId ? current : nextDistrictId));
    setBlockId((current) => (current === nextBlockId ? current : nextBlockId));
    setDistrictName((current) => (current === nextDistrictName ? current : nextDistrictName));
    setBlockName((current) => (current === nextBlockName ? current : nextBlockName));
  }, [user?.blockId, user?.blockName, user?.districtId, user?.districtName]);

  React.useEffect(() => {
    if (!user || roleId === ROLE_IDS.STATE_ADMIN) {
      return;
    }

    let cancelled = false;

    const resolveScope = async () => {
      let resolvedDistrictId = isLikelyScopeId(user.districtId) ? String(user.districtId) : '';
      let resolvedBlockId = isLikelyScopeId(user.blockId) ? String(user.blockId) : '';
      let resolvedDistrictName = user.districtName ?? (!resolvedDistrictId ? String(user.districtId ?? '') : '');
      let resolvedBlockName = user.blockName ?? (!resolvedBlockId ? String(user.blockId ?? '') : '');

      const districts = await getDistricts().catch(() => []);

      if (!resolvedDistrictId && resolvedDistrictName) {
        const matchedDistrict = districts.find(
          (district) => district.districtName.trim().toLowerCase() === resolvedDistrictName.trim().toLowerCase(),
        );
        resolvedDistrictId = matchedDistrict ? String(matchedDistrict.districtId) : '';
      }

      if (!resolvedDistrictName && resolvedDistrictId) {
        try {
          const matchedDistrict = districts.find(
            (district) => String(district.districtId) === String(resolvedDistrictId),
          );
          resolvedDistrictName = matchedDistrict?.districtName ?? String(resolvedDistrictId);
        } catch {
          resolvedDistrictName = String(resolvedDistrictId);
        }
      }

      if ((!resolvedBlockId || !resolvedBlockName) && resolvedDistrictId) {
        try {
          const blocks = await getBlocks(resolvedDistrictId);

          if (!resolvedBlockId && resolvedBlockName) {
            const matchedBlockByName = blocks.find(
              (block) => block.blockName.trim().toLowerCase() === resolvedBlockName.trim().toLowerCase(),
            );
            resolvedBlockId = matchedBlockByName ? String(matchedBlockByName.blockId) : '';
          }

          if (!resolvedBlockName && resolvedBlockId) {
            const matchedBlockById = blocks.find((block) => String(block.blockId) === String(resolvedBlockId));
            resolvedBlockName = matchedBlockById?.blockName ?? String(resolvedBlockId);
          }
        } catch {
          if (!resolvedBlockName && resolvedBlockId) {
            resolvedBlockName = String(resolvedBlockId);
          }
        }
      }

      if (!cancelled) {
        setDistrictId((current) => (current === resolvedDistrictId ? current : resolvedDistrictId));
        setBlockId((current) => (current === resolvedBlockId ? current : resolvedBlockId));
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
      districtId: districtId || user.districtId,
      blockId: blockId || user.blockId,
      districtName: districtName || user.districtName,
      blockName: blockName || user.blockName,
    };
  }, [blockId, blockName, districtId, districtName, user]);

  return {
    districtId,
    blockId,
    districtName,
    blockName,
    scopedUser,
  };
};
