import ExcelJS from 'exceljs/dist/es5/exceljs.browser'
import { mergeCells, saveAsExcel } from './utils'
import { WIDTH_RATIO } from './constants'
import plugins from './plugins'

const PLUGIN_FUNCS = ['workbookCreated', 'worksheetCreated', 'worksheetCompleted', 'workcellCreated']
const DEFAULT_WORKBOOK_OPTIONS = {
  views: [{
    x: 0, y: 0, width: 10000, height: 20000,
    firstSheet: 0, activeTab: 1, visibility: 'visible'
  }]
}
const DEFAULT_OPTIONS = {
  workbook: DEFAULT_WORKBOOK_OPTIONS,
  widthRatio: WIDTH_RATIO,
  plugins: [...Object.values(plugins)]
}

export default class Table2Excel {

  constructor (selector = 'table', options = {}) {
    this.tables = Array.from(
      typeof selector === 'string'
        ? document.querySelectorAll(selector)
        : selector
      )
     
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)

    this.plugins = {}
    PLUGIN_FUNCS.forEach(funName => {
      this.plugins[funName] = this.options.plugins.filter(plugin => plugin[funName]).map(plugin => plugin[funName])
    })

    this.pluginContext = {}
  }

  _invokePlugin (func, context = {}) {
    this.pluginContext = Object.assign({}, this.pluginContext, context)
    this.plugins[func].forEach(handler => handler.call(this, this.pluginContext))
  }

  toExcel () {
    const { tables, options } = this
    const workbook = new ExcelJS.Workbook() // create workbook

    Object.assign(workbook, options)

    // workbookCreated plugins
    this._invokePlugin('workbookCreated', { workbook, tables })

    tables.forEach((table, index) => {
      const worksheet = workbook.addWorksheet(`Sheet ${index + 1}`)

      // worksheetCreated plugins
      this._invokePlugin('worksheetCreated', { worksheet, table })

      this.toSheet(table, worksheet)

      // worksheetCompleted plugins
      this._invokePlugin('worksheetCompleted', { worksheet, table })
    })

    return this.workbook = workbook
  }

  toSheet (table, worksheet) {
    // get total cols and rows
    const totalRows = table.rows.length
    let totalCols = 0
   
    if (table.rows.length > 0) {
       for (let i = 0; i < table.rows[0].cells.length; i++) {
        
          totalCols += table.rows[0].cells[i].colSpan
         
       }
     }
     totalCols;
    const cells = []
    Array.from(table.rows).forEach(row => {
      const cellrow = [];
      Array.from(row.cells).forEach(cell =>{
        
          cellrow.push({
            rowRange: {},
            colRange: {},
            el: cell
          })
        
        
      })
      cells.push(cellrow)
    })
    // create matrix
    const helperMatrix = []

    for (let r = 0; r < totalRows; r++) {
      const row = []
      for (let c = 0; c < totalCols; c++) {
        row.push({ cell: null })
      }
      helperMatrix.push(row)
    }

    // mark matrix
    let cursorR = 0
    let cursorC = 0
    for (let r = 0; r < totalRows; r++) {
      cursorC=0;
      for (let c = 0; c < totalCols; c++) {
        // skip if current matrix unit is already assigned
       
        if (helperMatrix[r][c].cell) {
          continue
        }
        var elrowSpan=1 ;
        var elcolSpan=1;
        // assign cell to current matrix unit
        var cell = cells[cursorR][cursorC]
       if(cell==null&&cell==undefined){
        continue
       }
       elrowSpan=cell.el.rowSpan;
       elcolSpan=cell.el.colSpan;
        cell.rowRange = { from: r, to: r }
        cell.colRange = { from: c, to: c }
        
        cursorC++;
       
        var maxY=(r +elrowSpan);
        for (let y = r; y < maxY ; y++) {
         
          var maxX=(c +elcolSpan);
          for (let x = c; x < maxX; x++) {
              helperMatrix[y][x].cell = cell
              cell.colRange.to = x
              cell.rowRange.to = y
          }
        }
      
      }
      cursorR++;
    }

    // read matrix to sheet
    for(let x=0;x<cells.length;x++){
      var row=cells[x];
      for(let y=0;y<row.length;y++){
        const cell=row[y];
        const { rowRange, colRange, el } = cell
        const { innerText } = el
        // if(el.style.display=='none'){
        //   continue;
        // }
        const workcell = mergeCells(worksheet, colRange.from, rowRange.from, colRange.to, rowRange.to)
        const cellStyle = getComputedStyle(el)
  
        workcell.value = innerText
  
        // workcellCreated
        this._invokePlugin('workcellCreated', { workcell, cell: el, rowRange, colRange, cellStyle })
      }
    }
  }

  export (fileName, ext) {
    if (!this.workbook) {
      this.toExcel()
    }
    saveAsExcel(this.workbook, fileName, ext)
  }
}
