#!/bin/bash
mode=$1


for dir in bin test lib; do
	cd ./$dir
	orig=$(ls *.ts | grep '^orig_')
	test=$(ls *.ts | grep '^test_')
	target=$(ls *.ts | grep -Ev '^orig_|^test_')
	#echo "orig:$orig; targ:$target; test:$test"
#	echo here:$(pwd)
	if [ "$mode" == "test" ]; then
		#echo TG:$target
		echo cp -f $test $target
		
	elif [ "$mode" == "live" ]; then
		#echo TG:$target
		cp -f $orig $target
	fi
	cd ../
done

