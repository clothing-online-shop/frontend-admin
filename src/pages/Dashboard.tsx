import { Card, Col, Row, Statistic, Typography } from "antd";

export default function Dashboard() {
  return (
    <div>
      <Typography.Title level={3}>Dashboard</Typography.Title>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="Doanh thu hôm nay" value={0} suffix="đ" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Đơn hàng mới" value={0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Sản phẩm" value={0} />
          </Card>
        </Col>
      </Row>
      <Typography.Paragraph style={{ marginTop: 24 }} type="secondary">
        Biểu đồ doanh thu và top sản phẩm bán chạy sẽ được triển khai ở Sprint 6.
      </Typography.Paragraph>
    </div>
  );
}
