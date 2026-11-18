/*
// src/config/procesos.js
// Cada "proceso" representa una migración de tabla origen → destino
// Para agregar nuevas tablas en el futuro, solo agrega un nuevo objeto aquí

const procesos = {
  NS: {
    nombre: "Afiliados NS",
    tablaOrigen: "SUB_HISNSNEG",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    claveControl: "NSCONSE",
    campos: [
      { origen: "NSTIPDOCBDUA", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "NSNUMIDEBDUA", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "NSPRIAPEBDUA", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "NSSEGAPEBDUA", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "NSPRINOMBDUA", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "NSSEGNOMBDUA", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "NSFECNACBDUA", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "NSCODNOV", destino: "EGAC_TIPO_NOVEDAD" },
      { origen: "NSVAL1", destino: "EGAC_VALOR_1" },
      { origen: "NSVAL2", destino: "EGAC_VALOR_2" },
      { origen: "NSVAL3", destino: "EGAC_VALOR_3" },
      { origen: "NSVAL4", destino: "EGAC_VALOR_4" },
      { origen: "NSVAL5", destino: "EGAC_VALOR_5" },
      { origen: "NSVAL6", destino: "EGAC_VALOR_6" },
      { origen: "NSVAL7", destino: "EGAC_VALOR_7" },
      { origen: "NSCODDPTOBDUA", destino: "EGAC_DEPARTAMENTO" },
      { origen: "NSCODMUNIBDUA", destino: "EGAC_MUNICIPIO" },
      { origen: "NSFECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "NSGLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },


      { destino: "EGAC_PROCESO", valor: "NS" },
      { destino: "EGAC_REGIMEN", valor: "S" },

    ],
    filtro: {
      campoOrigen: "NSGLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },

  NC: {
    nombre: "Afiliados NC",
    tablaOrigen: "HISNCNEG",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    claveControl: "NCNEGCONSE",
    campos: [
      { origen: "NCNEGTIPDOCBDUA", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "NCNEGNUMIDEBDUA", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "NCNEGPRIAPEBDUA", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "NCNEGSEGAPEBDUA", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "NCNEGPRINOMBDUA", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "NCNEGSEGNOMBDUA", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "NCNEGFECNACBDUA", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "NCNEGCODNOV", destino: "EGAC_TIPO_NOVEDAD" },
      { origen: "NCNEGVAL1", destino: "EGAC_VALOR_1" },
      { origen: "NCNEGVAL2", destino: "EGAC_VALOR_2" },
      { origen: "NCNEGVAL3", destino: "EGAC_VALOR_3" },
      { origen: "NCNEGVAL4", destino: "EGAC_VALOR_4" },
      { origen: "NCNEGVAL5", destino: "EGAC_VALOR_5" },
      { origen: "NCNEGVAL6", destino: "EGAC_VALOR_6" },
      { origen: "NCNEGVAL7", destino: "EGAC_VALOR_7" },
      { origen: "NCNEGCODDPTOBDUA", destino: "EGAC_DEPARTAMENTO" },
      { origen: "NCNEGCODMUNIBDUA", destino: "EGAC_MUNICIPIO" },
      { origen: "NCNEGFECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "NCNEGGLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "NC" },
      { destino: "EGAC_REGIMEN", valor: "C" },

    ],
    filtro: {
      campoOrigen: "NCNEGGLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },

  MC: {
    nombre: "Afiliados MC",
    tablaOrigen: "HISMCNEG",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    campos: [
      { origen: "MCNEGTIPDOCAFIL", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "MCNEGNUMDOCAFIL", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "MCNEGPRIAPELLAFIL", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "MCNEGSEGAPELLAFIL", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "MCNEGPRINOMAFIL", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "MCNEGSEGNOMAFIL", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "MCNEGFECNACAFIL", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "MCNEGGENEROAFIL", destino: "EGAC_GENERO" },
      { origen: "MCNEGCODDEPAFIL", destino: "EGAC_DEPARTAMENTO" },
      { origen: "MCNEGCODMUNAFIL", destino: "EGAC_MUNICIPIO" },
      { origen: "MCFECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "MCNEGGLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "MC" },
      { destino: "EGAC_REGIMEN", valor: "C" },

    ],
    filtro: {
      campoOrigen: "MCNEGGLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },

  MS: {
    nombre: "Afiliados MS",
    tablaOrigen: "SUB_HISMSNEG",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    campos: [
      { origen: "MSNEGTIPIDEBDUA", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "MSNEGNUMIDEBDUA", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "MSNEGPRIAPEBDUA", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "MSNEGSEGAPEBDUA", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "MSNEGPRINOMBDUA", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "MSNEGSEGNOMBDUA", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "MSNEGFECNACBDUA", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "MSNEGSEXBDUA", destino: "EGAC_GENERO" },
      { origen: "MSNEGCODDEP", destino: "EGAC_DEPARTAMENTO" },
      { origen: "MSNEGCODMUN", destino: "EGAC_MUNICIPIO" },
      { origen: "MSNEGFECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "MSNEGGLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "MS" },
      { destino: "EGAC_REGIMEN", valor: "S" },

    ],
    filtro: {
      campoOrigen: "MSNEGGLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },

  R1: {
    nombre: "Afiliados R1",
    tablaOrigen: "HISR3",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    campos: [
      { origen: "R3TIPIDEAFI", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "R3NUMIDEAFI", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "R3PRIAPEAFI", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "R3SEGAPEAFI", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "R3PRINOMAFI", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "R3SEGNOMAFI", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "R3FECNACAFI", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "R3SEXAFI", destino: "EGAC_GENERO" },
      { origen: "R3CODDEP", destino: "EGAC_DEPARTAMENTO" },
      { origen: "R3CODMUN", destino: "EGAC_MUNICIPIO" },
      { origen: "R3FECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "R3GLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "R1" },
      { destino: "EGAC_REGIMEN", valor: "C" },

    ],
    filtro: {
      campoOrigen: "R3GLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },


  S1: {
    nombre: "Afiliados S1",
    tablaOrigen: "SUB_HISS3",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    campos: [
      { origen: "S3TIPIDEAFI", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "S3NUMIDEAFI", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "S3PRIAPEAFI", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "S3SEGAPEAFI", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "S3PRINOMAFI", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "S3SEGNOMAFI", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "S3FECNACAFI", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "S3SEXAFI", destino: "EGAC_GENERO" },
      { origen: "S3CODDEP", destino: "EGAC_DEPARTAMENTO" },
      { origen: "S3CODMUN", destino: "EGAC_MUNICIPIO" },
      { origen: "S3FECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "S3TGLOSA", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "S1" },
      { destino: "EGAC_REGIMEN", valor: "S" },

    ],
    filtro: {
      campoOrigen: "S3TGLOSA",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },




  // Ejemplo de futuro proceso — solo descomenta y completa:
  // RC: {
  //   nombre: "Recaudo RC",
  //   tablaOrigen: "SUB_RECAUDO",
  //   tablaDestino: "EGAG_RECAUDO_AFIL",
  //   campos: [ ... ],
  //   claves: [ ... ],
  // },
};

*/
// src/config/procesos.js
// Cada "proceso" representa una migración de tabla origen → destino
// Para agregar nuevas tablas en el futuro, solo agrega un nuevo objeto aquí

const procesos = {
  NS: {
    nombre: "Afiliados NS",
    tablaOrigen: "SUB_HISNSNEG",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    claveControl: "NSCONSE",
    campos: [
      { origen: "NSTIPDOCBDUA", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "NSNUMIDEBDUA", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "NSPRIAPEBDUA", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "NSSEGAPEBDUA", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "NSPRINOMBDUA", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "NSSEGNOMBDUA", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "NSFECNACBDUA", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "NSCODNOV", destino: "EGAC_TIPO_NOVEDAD" },
      { origen: "NSVAL1", destino: "EGAC_VALOR_1" },
      { origen: "NSVAL2", destino: "EGAC_VALOR_2" },
      { origen: "NSVAL3", destino: "EGAC_VALOR_3" },
      { origen: "NSVAL4", destino: "EGAC_VALOR_4" },
      { origen: "NSVAL5", destino: "EGAC_VALOR_5" },
      { origen: "NSVAL6", destino: "EGAC_VALOR_6" },
      { origen: "NSVAL7", destino: "EGAC_VALOR_7" },
      { origen: "NSCODDPTOBDUA", destino: "EGAC_DEPARTAMENTO" },
      { origen: "NSCODMUNIBDUA", destino: "EGAC_MUNICIPIO" },
      { origen: "NSFECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "NSGLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },


      { destino: "EGAC_PROCESO", valor: "NS" },
      { destino: "EGAC_REGIMEN", valor: "S" },

    ],
    filtro: {
      campoOrigen: "NSGLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },

  NC: {
    nombre: "Afiliados NC",
    tablaOrigen: "HISNCNEG",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    claveControl: "NCNEGCONSE",
    campos: [
      { origen: "NCNEGTIPDOCBDUA", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "NCNEGNUMIDEBDUA", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "NCNEGPRIAPEBDUA", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "NCNEGSEGAPEBDUA", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "NCNEGPRINOMBDUA", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "NCNEGSEGNOMBDUA", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "NCNEGFECNACBDUA", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "NCNEGCODNOV", destino: "EGAC_TIPO_NOVEDAD" },
      { origen: "NCNEGVAL1", destino: "EGAC_VALOR_1" },
      { origen: "NCNEGVAL2", destino: "EGAC_VALOR_2" },
      { origen: "NCNEGVAL3", destino: "EGAC_VALOR_3" },
      { origen: "NCNEGVAL4", destino: "EGAC_VALOR_4" },
      { origen: "NCNEGVAL5", destino: "EGAC_VALOR_5" },
      { origen: "NCNEGVAL6", destino: "EGAC_VALOR_6" },
      { origen: "NCNEGVAL7", destino: "EGAC_VALOR_7" },
      { origen: "NCNEGCODDPTOBDUA", destino: "EGAC_DEPARTAMENTO" },
      { origen: "NCNEGCODMUNIBDUA", destino: "EGAC_MUNICIPIO" },
      { origen: "NCNEGFECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "NCNEGGLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "NC" },
      { destino: "EGAC_REGIMEN", valor: "C" },

    ],
    filtro: {
      campoOrigen: "NCNEGGLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },

  MC: {
    nombre: "Afiliados MC",
    tablaOrigen: "HISMCNEG",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    campos: [
      { origen: "MCNEGTIPDOCAFIL", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "MCNEGNUMDOCAFIL", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "MCNEGPRIAPELLAFIL", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "MCNEGSEGAPELLAFIL", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "MCNEGPRINOMAFIL", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "MCNEGSEGNOMAFIL", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "MCNEGFECNACAFIL", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "MCNEGGENEROAFIL", destino: "EGAC_GENERO" },
      { origen: "MCNEGCODDEPAFIL", destino: "EGAC_DEPARTAMENTO" },
      { origen: "MCNEGCODMUNAFIL", destino: "EGAC_MUNICIPIO" },
      { origen: "MCFECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "MCNEGGLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "MC" },
      { destino: "EGAC_REGIMEN", valor: "C" },

    ],
    filtro: {
      campoOrigen: "MCNEGGLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },

  MS: {
    nombre: "Afiliados MS",
    tablaOrigen: "SUB_HISMSNEG",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    campos: [
      { origen: "MSNEGTIPIDEBDUA", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "MSNEGNUMIDEBDUA", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "MSNEGPRIAPEBDUA", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "MSNEGSEGAPEBDUA", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "MSNEGPRINOMBDUA", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "MSNEGSEGNOMBDUA", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "MSNEGFECNACBDUA", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "MSNEGSEXBDUA", destino: "EGAC_GENERO" },
      { origen: "MSNEGCODDEP", destino: "EGAC_DEPARTAMENTO" },
      { origen: "MSNEGCODMUN", destino: "EGAC_MUNICIPIO" },
      { origen: "MSNEGFECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "MSNEGGLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "MS" },
      { destino: "EGAC_REGIMEN", valor: "S" },

    ],
    filtro: {
      campoOrigen: "MSNEGGLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },

  R1: {
    nombre: "Afiliados R1",
    tablaOrigen: "HISR3",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    campos: [
      { origen: "R3TIPIDEAFI", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "R3NUMIDEAFI", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "R3PRIAPEAFI", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "R3SEGAPEAFI", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "R3PRINOMAFI", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "R3SEGNOMAFI", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "R3FECNACAFI", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "R3SEXAFI", destino: "EGAC_GENERO" },
      { origen: "R3CODDEP", destino: "EGAC_DEPARTAMENTO" },
      { origen: "R3CODMUN", destino: "EGAC_MUNICIPIO" },
      { origen: "R3FECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "R3GLOSAPROCESO", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "R1" },
      { destino: "EGAC_REGIMEN", valor: "C" },

    ],
    filtro: {
      campoOrigen: "R3GLOSAPROCESO",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },


  S1: {
    nombre: "Afiliados S1",
    tablaOrigen: "SUB_HISS3",
    tablaDestino: "EGAG_GLOSAS_AFILIADOS",
    campos: [
      { origen: "S3TIPIDEAFI", destino: "EGAC_TIPO_DOCUMENTO" },
      { origen: "S3NUMIDEAFI", destino: "EGAC_NUMERO_DOCUMENTO" },
      { origen: "S3PRIAPEAFI", destino: "EGAC_PRIMER_APELLIDO" },
      { origen: "S3SEGAPEAFI", destino: "EGAC_SEGUNDO_APELLIDO" },
      { origen: "S3PRINOMAFI", destino: "EGAC_PRIMER_NOMBRE" },
      { origen: "S3SEGNOMAFI", destino: "EGAC_SEGUNDO_NOMBRE" },
      { origen: "S3FECNACAFI", destino: "EGAF_FECHA_NACIMIENTO" },
      { origen: "S3SEXAFI", destino: "EGAC_GENERO" },
      { origen: "S3CODDEP", destino: "EGAC_DEPARTAMENTO" },
      { origen: "S3CODMUN", destino: "EGAC_MUNICIPIO" },
      { origen: "S3FECHAPROCESO", destino: "EGAF_FECHA_PROCESO" },
      { origen: "S3TGLOSA", destino: "EGAC_GLOSA_PROCESO" },




      { destino: "EGAC_PROCESO", valor: "S1" },
      { destino: "EGAC_REGIMEN", valor: "S" },

    ],
    filtro: {
      campoOrigen: "S3TGLOSA",
      longitudPrefijo: 6,
      consultaValidacion: "SELECT t.egac_codigo_glosa FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'"
    }
  },




  // Ejemplo de futuro proceso — solo descomenta y completa:
  // RC: {
  //   nombre: "Recaudo RC",
  //   tablaOrigen: "SUB_RECAUDO",
  //   tablaDestino: "EGAG_RECAUDO_AFIL",
  //   campos: [ ... ],
  //   claves: [ ... ],
  // },
};

module.exports = procesos;
