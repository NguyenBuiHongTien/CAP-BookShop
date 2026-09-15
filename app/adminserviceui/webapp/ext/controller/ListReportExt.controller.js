sap.ui.define([
  "sap/ui/core/mvc/ControllerExtension",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/Fragment"
], function (ControllerExtension, MessageBox, MessageToast, Fragment) {
  "use strict";

  return ControllerExtension.extend("adminserviceui.ext.controller.ListReportExt", {

    /**
     * Được gọi khi bấm nút Upload Excel trên toolbar
     */
    onUploadExcel: function () {
      this._openUploadDialog();
    },

    _openUploadDialog: async function () {
      const oView = this.base.getView();

      if (!this._pUploadDialog) {
        this._pUploadDialog = Fragment.load({
          id: oView.getId(),
          name: "adminserviceui.ext.fragment.UploadDialog",
          controller: this
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }

      const oDialog = await this._pUploadDialog;
      oDialog.open();
    },

    onFileChange: function (oEvent) {
      const aFiles = oEvent.getParameter("files");
      this._oSelectedFile = (aFiles && aFiles.length) ? aFiles[0] : null;
    },

    onUploadPress: async function () {
      if (!this._oSelectedFile) {
        MessageBox.error("Please select an Excel file (.xlsx)");
        return;
      }

      const sFileName = this._oSelectedFile.name || "";
      if (!sFileName.toLowerCase().endsWith(".xlsx") && !sFileName.toLowerCase().endsWith(".xls")) {
        MessageBox.error("Only .xlsx or .xls files are allowed");
        return;
      }

      try {
        const sBase64 = await this._fileToBase64(this._oSelectedFile);

        // Gọi UploadService bạn đã viết
        const oResponse = await fetch("/upload/uploadBooksFromBase64", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fileName: sFileName,
            fileBase64: sBase64
          })
        });

        const oJson = await oResponse.json();

        // OData action thường bọc trong .value
        const oResult = oJson.value || oJson;

        if (oResult.error) {
          throw new Error(oResult.error.message || "Upload failed");
        }

        // ===== ĐÓNG DIALOG TRƯỚC =====
        const oDialog = await this._pUploadDialog;
        oDialog.close();
        this._oSelectedFile = null;

        if (oResult.success) {
          MessageToast.show(oResult.message || ("Inserted " + (oResult.inserted || 0) + " book(s)"));
        } else {
          const sErrors = (oResult.errors && oResult.errors.length)
            ? "\n\n" + oResult.errors.join("\n")
            : "";
          MessageBox.warning((oResult.message || "Upload finished with errors") + sErrors,
        {
          title: "Kết quả Upload",
          actions: [MessageBox.Action.OK],
          emphasizedAction: MessageBox.Action.OK,
          onClose: () => {
            // Chỉ refresh khi người dùng bấm OK
            if (this.base.getExtensionAPI?.refresh) {
              this.base.getExtensionAPI().refresh();
            }
          }
        }
        );
        }

        // // Refresh danh sách Books
        // if (this.base.getExtensionAPI && this.base.getExtensionAPI().refresh) {
        //   this.base.getExtensionAPI().refresh();
        // }

        // const oDialog = await this._pUploadDialog;
        // oDialog.close();
        // this._oSelectedFile = null;

      } catch (oError) {
        console.error(oError);
        MessageBox.error("Upload failed: " + (oError.message || oError));
      }
    },

    onCancelPress: async function () {
      const oDialog = await this._pUploadDialog;
      oDialog.close();
      this._oSelectedFile = null;
    },

    _fileToBase64: function (oFile) {
      return new Promise(function (resolve, reject) {
        const oReader = new FileReader();
        oReader.onload = function () {
          // data:application/...;base64,XXXX → lấy phần sau dấu phẩy
          const sResult = oReader.result || "";
          const sBase64 = sResult.indexOf(",") >= 0 ? sResult.split(",")[1] : sResult;
          resolve(sBase64);
        };
        oReader.onerror = reject;
        oReader.readAsDataURL(oFile);
      });
    }
  });
});