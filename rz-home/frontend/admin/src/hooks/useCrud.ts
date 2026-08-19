import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import type { Paged } from "../types";
import { errMsg } from "../api/client";

// 通用分页列表 hook：管理 page/pageSize/loading/数据，fetcher 变更或 reload 时重新拉取
export function usePagedList<T>(
  fetcher: (p: { page: number; page_size: number }) => Promise<Paged<T>>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<Paged<T>>({ items: [], page: 1, page_size: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetcher({ page, page_size: pageSize })
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) message.error(errMsg(e, "列表加载失败"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, refreshKey, ...deps]);

  return { data, loading, page, setPage, pageSize, setPageSize, reload };
}

// 通用删除：确认后调用 del，成功后 message + reload
export function useDelete(
  del: (id: number) => Promise<unknown>,
  onDone: () => void,
  successText = "删除成功",
) {
  return useCallback(
    async (id: number) => {
      try {
        await del(id);
        message.success(successText);
        onDone();
      } catch (e) {
        message.error(errMsg(e, "删除失败"));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [del, onDone],
  );
}
