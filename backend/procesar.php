<?php
	
	$PATH_HTK = "C:/Users/Gonzalo/Dropbox/Webs/casa.gzalo.com/habla/proc/";
	$PATH_UPL = "C:/Users/Gonzalo/Dropbox/Webs/casa.gzalo.com/habla/subidas/";

	function get_string_between($string, $start, $end){
		$string = ' ' . $string;
		$ini = strpos($string, $start);
		if ($ini == 0) return '';
		$ini += strlen($start);
		$len = strpos($string, $end, $ini) - $ini;
		return substr($string, $ini, $len);
	}
	
	function microtime_float(){
		list($usec, $sec) = explode(" ", microtime());
		return ((float)$usec + (float)$sec);
	}

	function procesar($nombre){
		global $PATH_HTK, $PATH_UPL;
		
		$time_start = microtime_float();
		$nombremfc = pathinfo($nombre, PATHINFO_FILENAME) . '.mfc';
		
		chdir($PATH_UPL);

		$comando1 = $PATH_HTK . 'HCopy -T 1 -C ../config.hcopy ' . escapeshellcmd($nombre) . ' ' . escapeshellcmd($nombremfc);
		exec($comando1, $resultado_hcopy);
		
		if(count($resultado_hcopy) > 1){
			print_r($resultado_hcopy);
			exit();
		}else{
			//echo $resultado_hcopy[0] . "<br/>";
		}

		$comando2 = $PATH_HTK . "HVite -T 1 -l '*' -p 0.0 -s 5.0 -C ../config.common -o NSTWM -w ../wdnet -H ../macros -H ../hmmdefs ../diccionario ../fonemas " . escapeshellcmd($nombremfc);
		
		exec($comando2, $resultado_hvite);	
			
		if(count($resultado_hvite) != 5){
			print_r($resultado_hvite);
			exit();
		}else{
			$reconocido = get_string_between($resultado_hvite[4],"enviar-com","enviar-fin");
			echo utf8_encode($reconocido);
			/*$recdata = substr($resultado_hvite[4], strpos($resultado_hvite[4], "frames]"));
			echo $recdata;*/
		}
	
		$time_end = microtime_float();
		$time = round($time_end - $time_start,2);
		
		echo " (Procesado en $time segundos)";
	}
	
	$nombre = md5(rand()).'.wav';
	
	if(!isset($_FILES['data']))
		exit();
	
	$uploadfile = $PATH_UPL . $nombre;

	if (move_uploaded_file($_FILES['data']['tmp_name'], $uploadfile)) {
		procesar($nombre);
	}
