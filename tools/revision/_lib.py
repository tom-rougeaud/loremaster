# -*- coding: utf-8 -*-
# Aide d’écriture : C = QCM (la BONNE réponse en premier : le jeu mélange), V = vrai/faux, S = curseur.
# Utilisation : from _lib import *  … C("xxx-001",niveau,"énoncé",[bonne,faux1,faux2,faux3],"explication","source") … save("theme-id")
import json,os,sys
R={}
def C(i,n,q,ch,e,s): R[i]={"q":q,"choix":ch,"rep":0,"expl":e,"src":s,"niveau":n}
def V(i,n,q,rep,e,s): R[i]={"q":q,"rep":bool(rep),"expl":e,"src":s,"niveau":n}
def S(i,n,q,mn,mx,pas,u,tol,rep,e,s): R[i]={"q":q,"min":mn,"max":mx,"pas":pas,"unite":u,"tolerance":tol,"rep":rep,"expl":e,"src":s,"niveau":n}
def save(theme):
    json.dump(R,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),theme+".json"),"w",encoding="utf-8"),ensure_ascii=False,indent=1)
    print(theme,len(R),"questions écrites")
