const Table = require("../models/table.model");

// ADD NEW TABLE
const addNewTable = async (req, res) => {
  try {
    const { capacity, tableName } = req.body;

    if (!capacity || !tableName) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    const table = await Table.create({
      capacity,
      tableName,
    });

    if (!table) {
      return res.status(400).json({
        status: false,
        message: "Table not created",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Table created successfully",
      table,
    });
  } catch (error) {
    console.log("Error while creating table :- ", error.message);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

const getAllTables = async (_, res) => {
  try {
    const tables = await Table.find().populate({
      path: "currentCustomerId",
      select: "name email totalPerson orderHistory",
      populate: {
        path: "orderHistory",
        match: {
          status: { $in: ["PENDING", "HOLD"] },
        },
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "items",
          select: "dish qty",
          populate: {
            path: "dish",
            select: "name price category status",
          },
        },
        select: "status totalAmount orderType paymentStatus",
        perDocumentLimit: 1,
      },
    });

    if (!tables || tables.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No tables found",
      });
    }

    const modifiedTable = tables.map((table) => {
      let modifiedTable = table.toObject();

      if (table.currentCustomerId) {
        modifiedTable.currentCustomer = table.currentCustomerId.toObject();
        delete modifiedTable.currentCustomerId;

        if (modifiedTable.currentCustomer.orderHistory?.length > 0) {
          modifiedTable.currentOrderInfo =
            modifiedTable.currentCustomer.orderHistory[0];
          delete modifiedTable.currentCustomer.orderHistory;
        } else {
          delete modifiedTable.currentCustomer.orderHistory;
        }
      }

      return modifiedTable;
    });

    return res.status(200).json({
      status: true,
      message: "All tables",
      tables: modifiedTable,
    });
  } catch (error) {
    console.error("Error while getting all tables:", error.message);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = { addNewTable, getAllTables };
