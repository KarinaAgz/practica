sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], (Controller, Filter, FilterOperator, MessageToast, Fragment) => {
    "use strict";

    return Controller.extend("logaligroup.practica2.controller.Main", {
        onInit() {
            var v = this.getView();
            var oUiModel = this.getOwnerComponent().getModel("ui");
            if (!oUiModel) {
                //Falback:create a new json model if not defined
                oUiModel = new sap.ui.model.json.JSONModel({
                    headerExpaanded: true,
                    filters: {
                        productName: "",
                        category: "",
                        supplier: "",
                        stockStatus: ""
                    }
                });
            }
            v.setModel(oUiModel, "ui")
        },
        //formatter for stock statust text
        formatStockStatus: function (iUnitsInStock) {
            if (iUnitsInStock === 0) {
                return this.getView().getModel("i18n").getResourceBundle().getText("stockOutOfStock");

            } else if (iUnitsInStock < 20) {
                return this.getView().getModel("i18n").getResourceBundle().getText("stockLowStock");

            }
            return this.getView().getModel("i18n").getResourceBundle().getText("stockInStock");
        },
        //formatter for stock sttaus state(color)

        formatStockStatusStates: function (iUnitsInStock) {
            if (iUnitsInStock === 0) {
                return "Error";
            } else if (iUnitsInStock < 20) {
                return "Warning";
            }
            return "Success";
        },

        //formatter for price (converts string to float)
        formatPrice: function (sPrice) {
            return parseFloat(sPrice) || 0;
        },

        //formaatter for currency display
        formatter: {
            formatCurrency: function (fValue) {
                return new sap.ui.model.type.Currency().formatValue([fValue, "USD"], "string");

            }
        },

        //Handle filter input change 
        onFilteerChange: function (oEvent) {
            this.getView().byId("productTable").getBinding("rows").filter(this._getFilters());
        },

        //Handle stock status radio button seleccion
        onStockStatusSelect: function (oEvent) {
            var v = this.getView();//local variable 'v' for brevity
            var iIndex = oEvent.getParameter("selectedIndex");
            var sStockStatus = iIndex === 0 ? "InStock" : iIndex === 1 ? "LowStock" : iIndex === 2 ? "OutOfStock" : "";
            v.getModel("ui").setProperty("/filters/stockStatus", sStockStatus);
            v.byId("productTable").getBinding("rows").filter(this._getFilters());
        },

        //Build filters for the table
        _getFilters: function () {
            var v = this.getView(); //local variable 'v' for brevity
            var oFilters = v.getModel("ui").getProperty("/filters");
            var aFilters = [];

            //Product Name filter
            if (oFilters.productName) {
                aFilters.push(new Filter("ProductName", FilterOperator.Contains, oFilters.productName));
            }
            //Category filter
            if (oFilters.category) {
                aFilters.push(new Filter("categoryID", FilterOperator.EQ, oFilters.category));

            }
            if (oFilters.supplier) {
                aFilters.push(new Filter("SupplierID", FilterOperator.EQ, oFilters.supplier));
            }

            //Stock Status filter
            if (oFilters.stockStatus) {
                if (oFilters.stockStatus === "InStock") {
                    aFilters.push(new Filter("UnitsInStock", FilterOperator.GE, 20));
                } else if (oFilters.stockStatus === "LowStock") {
                    aFilters.push(new Filter([
                        new Filter("UnitsInStock", FilterOperator.GT, 0),
                        new Filter("UnitsInStock", FilterOperator.LT, 20)
                    ], true));

                } else if (oFilters.stockStatus === "OutOfStock") {
                    aFilters.push(new Filter("UnitsInStock", FilterOperator.EQ, 0));
                }
            }
            return aFilters;
        },
        //Clear all filters
        onClearFilters: function () {
            var v = this.getView(); //local variable 'v' for brevity
            v.getModel("ui").setData({
                headerExpaanded: true,
                filters: {
                    productName: "",
                    category: "",
                    supplier: "",
                    stockStatus: ""
                }
            });
            v.byId("ProductTable").getBinding("rows").filter([]);
        },

        //Show product details in a popover

        onDetailsPress: function (oEvent) {
            var v = this.getView(); //local variable 'v' fro brevity
            var oContext = oEvent.getSource().getBindingContext();
            var oSourceControl = oEvent.getSource();

            if (!this._pPopover) {
                //'_pPopover' is a controller property (promise) to store the popover fragment
                //Named with '_p' prefix to indicete a priveate promise

                this._pPopover = Fragment.load({
                    id: v.getId(),
                    name: "logaligroup.practica2.fragments.CardFrgament",
                    Controller: this
                }).then(function (oPopover) {
                    v.addDependent(oPopover);
                    return oPopover;
                });
            }
            this._pPopover.then(function (oPopover) {
                oPopover.bindElement(oContext.getPath());
                oPopover.openBy(oSourceControl);
            });

        },
        //placeholder for Edit button
        onEditPress: function () {
            MessageToast.show("Edit functionality not implement yet.");
        },
        //palceholder for Share button 
        onDeletePress: function () {
            MessageToast.show("Delete functionality not implement yet");
        },

        //placehplder for Share button
        onSharePress: function () {
            MessageToast.show("Share functionality not implemented yet");
        },
        //placeholder for Accept button
        onAccept: function () {
            MessageToast.show("Accept action triggered");
        },

        //Placeholder for reject button 
        onReject: function () {
            MessageToast.show("Reject action triggered ")
        },

        formatter: {
            formatCurrency: function (fValue) {
                return new sap.ui.model.type.Currency().formatValue([fValue, "USD"], "string");
            }
        }



    });
});
