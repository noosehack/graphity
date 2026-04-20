#include <stdlib.h>
#include <stdio.h>
#include <sys/stat.h>
#include <sys/mman.h>
#include <unistd.h>
#include <fcntl.h>
#include <string.h>
#include <iostream>
#include <math.h>
//#include <iostream>

//Martin Ankerl's pow, might now be working with all compiler
inline double fastPow(double a, double b){
  union {
    double d;
    int x[2];
  } u = { a };
  u.x[1]=(int)(b*(u.x[1]-1072632447)+1072632447);
  u.x[0]=0;
  return u.d;
}

//second best, vanilla
int integer_pow(int x, int n){
  int r=1; while(n--) r*=x;
  return r;
}

//IF TRANS true -> COLWISE, else ROWWISE
int* tojsbld(std::string,std::string,std::string,bool);

int* tojsbld(std::string fl,std::string nm,bool trans){
  const char *memnm=fl.c_str();//fyi /dev/shm and /run/shm both points to volatile mem
  std::string path="/tmp/"+nm+".bin";
  const char *memct=path.c_str();

  int fd=open(memnm,O_CREAT|O_RDONLY,(mode_t)0600);//open the filedescriptor
  if(fd==-1){ perror("you probably forgot to specify the argument path of the file to read"); exit(EXIT_FAILURE); }

  int ofd=open(memct,O_CREAT|O_RDWR,S_IRUSR|S_IWUSR);//open the output fd
  if(ofd==-1){ perror("error opening file for writing"); exit(EXIT_FAILURE); }
  
  struct stat info={0};
  if(fstat(fd,&info)==-1){ perror("error file size get"); exit(EXIT_FAILURE); }
  if(info.st_size==0){ fprintf(stderr,"error: empty file"); exit(EXIT_FAILURE); }

  char *map=(char*)mmap(0,info.st_size,PROT_READ,MAP_SHARED,fd,0);
  if(map==MAP_FAILED){ close(fd);perror("error mmapping file"); exit(EXIT_FAILURE); }

  off_t cc=0;int lns=0;int cls=0;
  std::string clss="{cn:['",rwss=",rn:['"; bool firstcol=true;
  while(map[cc]!='\n'){ if(map[cc]==';'){ ++cls; if(!firstcol) clss+="','"; firstcol=false; ++cc; }else{ if(!firstcol) clss+=map[cc]; ++cc; } }
  while(cc<info.st_size){ if(map[cc]=='\n') ++lns; ++cc; }; --lns;
  
  //getting the cls and lns cost 80ms
  int osize=cls*lns*sizeof(double);
  //double mmap
  double *omap=(double*)mmap(0,osize,PROT_READ|PROT_WRITE,MAP_SHARED,ofd,0);
  if(omap==MAP_FAILED){ close(ofd);perror("error mmapping"); exit(EXIT_FAILURE); }
  if(ftruncate(ofd,osize)==-1){ 
    close(ofd);perror("error resizing mmap");exit(EXIT_FAILURE);
  }

  off_t k=0; while(map[k]!='\n'){ ++k; }; ++k;
  off_t dti=0;while(map[k]!=';'){ rwss+=map[k]; ++dti;++k; }
  off_t vl=0,i=k,ln=0,cl=0; //std::cout << map[i] << "\n";
  
  while(i<info.st_size){//starts with a ';' (in k+11)
    if(map[i]==';'){
      double r=0.0;bool neg=false;++i;//init
      if(map[i]=='-'){ neg=true;++i; }
      while(map[i]>='0' && map[i]<='9'){ r=(r*10.0)+(map[i]-'0');++i; }
      if(map[i]=='.'){ double f=0.0;int n=0;++i;//init decimal part
	while(map[i]>='0' && map[i]<='9'){ f=(f*10.0)+(map[i]-'0');++i;++n; }
	//WARNING FASTPOW GIVES AWESOME RESULT BUT HAS A PRECISION PB
	//r+=f/fastPow(10.0,n);//std::pow introduced by boost is way faster
	r+=f/pow(10.0,n);//std::pow introduced by boost is way faster
      }
      if(neg){ r=-r; }
      if(map[i]=='N'){ r=-99999; i+=2; }      
      if(trans){ omap[cl*lns+ln]=r; }else{ omap[vl]=r; }
      ++cl;
      if(map[i]=='\n'){
	if(i+1<info.st_size){
	  rwss+="','";
	  for(size_t dk=(i+1);dk<=(i+dti);++dk){ rwss+=map[dk]; }
	}
	i+=dti;++ln; cl=0;
      }
      ++vl;--i;
    }
    ++i;
  }

  std::cout << clss << "']";
  std::cout << rwss << "']";
  
  // print the js blade format
  int usiz=cls*lns; int clcnt=1;
  std::cout << ",vec:[[" << omap[0];
  for(int cnt=1;cnt<usiz;++cnt){
    if(clcnt==lns){ std::cout << "],[" << omap[cnt]; ++cnt; clcnt=1; }
    if(omap[cnt]==-99999) std::cout << "," << "NA"; else std::cout << "," << omap[cnt];
    clcnt++;
    }
  std::cout << "]]};";
  
  if(munmap(map,info.st_size)==-1){ perror("error un-mmapping");exit(EXIT_FAILURE); }
  if(munmap(omap,osize)==-1){ perror("error un-mmapping");exit(EXIT_FAILURE); }
  close(ofd);close(fd);//close the file descriptor

  // if(remove(path)!=0) std::cerr << "Unable to remove the /tmp/ mmap file\n";

  static int res[2];res[0]=lns;res[1]=cls;
  return res;
}

int main(int argc, char *argv[]){
  bool help=false,col=true; std::string fl,flnm;//default params  

  /*MANUAL*/
  std::string man="*************** BASIC MANUAL ****************\n\n-fi | --file is the filepath to file input (no default value).\n**** file input format must be csv like, with ';' as separator\n\nExample: tojsbld -fi Ctsmall2.csv\n";

  if(argc==1){ std::cout << man; return 1; }//no param

  /*PARSING PARAMS*/
  for(size_t i=0;i<argc;++i){
    if(strcmp(argv[i],"-fi")==0 || strcmp(argv[i],"--file")==0){
      ++i; if(i<argc) fl=argv[i];
    }
    if(strcmp(argv[i],"-h")==0 || strcmp(argv[i],"--help")==0 || strcmp(argv[i],"-?")==0)
      help=true;
  }
  if(help){ std::cout << man; return 1; }//asked for help

  /*PARSE THE PATH TO GET A NAME TO STORE IN BINARY VOLATILE MEM*/
  for(size_t k=0;k<fl.length();++k){
    //>0 to avoid path like ./data/
    if(fl[k]=='.' && k>0) break;//break to skip file extension
    if(fl[k]=='/') flnm=""; else flnm+=fl[k];
  }
  //cat /proc/mounts shows that tmpfs filesystem is in /dev/shm and /tmp
  std::string sfl="/tmp/"+flnm+".bin";

  tojsbld(fl,flnm,true);//rowwise if false, colwise if true -> we map it cw to print it sequentially
  //tojsbld(fl,flnm,false);

  return 0;
}
// g++ -O3 jsbld.cpp -o jsbld 
