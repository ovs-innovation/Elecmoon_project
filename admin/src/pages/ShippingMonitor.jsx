import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
  Badge,
} from "@windmill/react-ui";
import PageTitle from "@/components/Typography/PageTitle";
import OrderServices from "@/services/OrderServices";
import { notifyError, notifySuccess } from "@/utils/toast";

const ShippingMonitor = () => {
  const [monitor, setMonitor] = useState(null);
  const [failed, setFailed] = useState([]);
  const [dlq, setDlq] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [m, f, d] = await Promise.all([
        OrderServices.getShippingMonitor(),
        OrderServices.getFailedShipments(),
        OrderServices.getShippingDlq(),
      ]);
      setMonitor(m);
      setFailed(f?.orders || []);
      setDlq(d?.items || []);
    } catch (err) {
      notifyError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const retryFailed = async (id) => {
    try {
      setBusyId(id);
      await OrderServices.retryFailedShipment(id);
      notifySuccess("Re-queued for fulfillment");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const requeueDlq = async (id) => {
    try {
      setBusyId(id);
      await OrderServices.requeueShippingDlq(id);
      notifySuccess("DLQ item re-queued");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const health = monitor?.health || {};
  const stats = monitor?.stats || {};

  return (
    <>
      <PageTitle>Shiprocket Monitor</PageTitle>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">API health</p>
            <p className="text-xl font-semibold">
              {health.healthy === false ? "ALERT" : "OK"}
            </p>
            <p className="text-xs mt-1">
              Consecutive failures: {health.consecutiveFailures ?? 0}/
              {health.alertThreshold ?? 5}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Queue</p>
            <p className="text-xl font-semibold">
              {stats.queue?.queued ?? 0} queued
            </p>
            <p className="text-xs mt-1">
              processing {stats.queue?.processing ?? 0} · dead{" "}
              {stats.queue?.dead ?? 0}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Failed orders</p>
            <p className="text-xl font-semibold">{stats.failedOrders ?? 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Dead letter</p>
            <p className="text-xl font-semibold">{stats.dlq?.open ?? 0} open</p>
            <p className="text-xs mt-1">
              Worker: {stats.workerActive ? "active" : "stopped"}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Failed fulfillments</h2>
        <Button size="small" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <TableContainer className="mb-8">
        <Table>
          <TableHeader>
            <tr>
              <TableCell>Order</TableCell>
              <TableCell>Shipment / AWB</TableCell>
              <TableCell>Error</TableCell>
              <TableCell>Action</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {failed.map((o) => (
              <TableRow key={o._id}>
                <TableCell>
                  <span className="font-semibold">{o.orderId}</span>
                  <div className="text-xs text-gray-500">
                    {o.shiprocketFulfillmentStatus}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  SR: {o.shiprocketShipmentId || "—"}
                  <br />
                  AWB: {o.awbCode || "—"}
                </TableCell>
                <TableCell className="text-xs max-w-sm truncate">
                  {o.shiprocketFulfillmentError || "—"}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    disabled={busyId === o._id}
                    onClick={() => retryFailed(o._id)}
                  >
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!failed.length && (
              <TableRow>
                <TableCell colSpan={4}>
                  <span className="text-sm text-gray-500">
                    No failed fulfillments
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <h2 className="text-lg font-semibold mb-3">Dead letter queue</h2>
      <TableContainer className="mb-8">
        <Table>
          <TableHeader>
            <tr>
              <TableCell>Order</TableCell>
              <TableCell>Attempts</TableCell>
              <TableCell>Error</TableCell>
              <TableCell>Action</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {dlq.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <span className="font-semibold">{item.orderId}</span>
                  <div className="text-xs">
                    <Badge type="danger">{item.status}</Badge>
                  </div>
                </TableCell>
                <TableCell>{item.attempts}</TableCell>
                <TableCell className="text-xs max-w-sm truncate">
                  {item.lastError}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    disabled={busyId === item._id || item.status !== "open"}
                    onClick={() => requeueDlq(item._id)}
                  >
                    Requeue
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!dlq.length && (
              <TableRow>
                <TableCell colSpan={4}>
                  <span className="text-sm text-gray-500">DLQ empty</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {health.lastError && (
        <Card>
          <CardBody>
            <p className="text-sm font-semibold mb-1">Last Shiprocket API error</p>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(health.lastError, null, 2)}
            </pre>
          </CardBody>
        </Card>
      )}
    </>
  );
};

export default ShippingMonitor;
