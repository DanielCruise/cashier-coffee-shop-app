import {
  Button,
  ConfigProvider,
  Empty,
  message,
  notification,
  Space,
  Table,
} from "antd";
import { useEffect, useState } from "react";

const lockerOrder = "wunderbar_order";
const apiUrl = process.env.REACT_APP_API_URL;

const columns = [
  {
    title: "Table No.",
    dataIndex: "key",
    sorter: (a, b) => a.key - b.key,
    sortDirections: ["ascend", "descend"],
  },
  {
    title: "Customer",
    dataIndex: "customer",
  },
  {
    title: "Details",
    dataIndex: "description",
    width: "50%",
  },
  {
    title: "Total Price ($)",
    dataIndex: "price",
    width: "15%",
  },
  {
    title: "Timestamp",
    dataIndex: "timeStamp",
    sorter: (a, b) => {
      let timeA = a.timeStamp.split(":");
      let timeB = b.timeStamp.split(":");
      return (
        ((Number(timeA[0]) - Number(timeB[0])) * 3600 +
          (Number(timeA[1]) - Number(timeB[1]))) *
          60 +
        (Number(timeA[2]) - Number(timeB[2]))
      );
    },
    sortDirections: ["descend", "ascend"],
    width: "10%",
  },
  {
    title: "Status",
    dataIndex: "status",
    filters: [
      {
        text: "Received",
        value: "Received",
      },
      {
        text: "Processing",
        value: "Processing",
      },
      {
        text: "Cancelled",
        value: "Cancelled",
      },
      {
        text: "Done",
        value: "Done",
      },
    ],
    onFilter: (value, record) => record.status.startsWith(value),
    filterSearch: true,
    width: "10%",
  },
];
let data = [
  {
    key: 4,
    customer: "anh Dong",
    description:
      "Milk tea coffee: Hot drink Size S with 4 pumps of chocolate sauce: 3.25$\nSandwiches: with turkey and egg: 5$",
    price: "10$",
    timeStamp: "15:30",
    status: "New",
  },
  {
    key: 1,
    customer: "anh Duc",
    description:
      "Traditional coffee: Blended drink Size XL: 4$\nBagels: with butter: 3.5$",
    price: "8$",
    timeStamp: "15:35",
    status: "In Progress",
  },
  {
    key: 3,
    customer: "anh Hoang",
    description:
      "Traditional coffee: Cold drink Size L: 3.5$\nBagels: with cream cheese: 3.5$",
    price: "7$",
    timeStamp: "15:15",
    status: "Done",
  },
];
const OrderList = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableData, setTableData] = useState(data);
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const updateBillStatus = (status) => {
    let updatedData = [];
    for (let i = 0; i < selectedRowKeys.length; i++) {
      const result = data.find((obj) => obj.key === selectedRowKeys[i]);
      if (result.status === status) {
        result.status = status === "Received" ? "Processing" : "Done";
        if (status === "Received") {
          notification.info({
            message: "Bill for table " + result.key + " received!",
            description: "The order is being prepared!",
            placement: "topRight",
          });
        } else {
          message.success("The bill for table " + result.key + " done!");
        }
      }
      updatedData.push({
        timeStamp: result.timeStamp,
        price: result.price,
        description: result.description,
        id: result.id,
        table: result.key,
        customer: result.customer,
        status: result.status,
      });
    }

    fetch(apiUrl + "/upsert/" + lockerOrder, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(updatedData),
    });

    setTableData(updatedData);
    setSelectedRowKeys([]);
  };

  const receiveBill = () => {
    updateBillStatus("Received");
  };

  const billDone = () => {
    updateBillStatus("Processing");
  };

  async function getOrderStatus() {
    const res = await fetch(apiUrl + "/get/" + lockerOrder);
    const data1 = await res.json();
    data = [];
    if (
      data1 !== null && // 👈 null and undefined check
      Object.keys(data1).length > 0 &&
      Object.getPrototypeOf(data1) === Object.prototype
    ) {
      let data2 = [data1];
      for (var i = 0; i < data2.length; i++) {
        data.push({
          key: data2[i]["table"],
          customer: data2[i]["customer"],
          description: data2[i]["description"],
          price: data2[i]["price"],
          timeStamp: data2[i]["timeStamp"],
          status: data2[i]["status"],
          id: data2[i]["id"],
        });
      }
      setTableData(data);
    } else {
      setTableData(null);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      getOrderStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <ConfigProvider
        renderEmpty={() => <Empty description="No recent bill" />}
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={tableData}
          style={{ whiteSpace: "pre-wrap" }}
        />
      </ConfigProvider>
      <Space wrap style={{ float: "right" }}>
        <Button
          type="primary"
          style={{ backgroundColor: "goldenrod" }}
          onClick={receiveBill}
        >
          Process selected bills
        </Button>
        <Button
          type="primary"
          style={{ backgroundColor: "green" }}
          onClick={billDone}
        >
          Selected bills done
        </Button>
      </Space>
    </div>
  );
};
export default OrderList;
